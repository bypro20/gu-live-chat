import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { findWebsiteForWidget } from '@/lib/website-widget-safe'
import { isPlatformMarketingWebsiteId } from '@/lib/marketing-website'
import { resolveWidgetAgentIdentity } from '@/lib/widget-bot-identity'
import { loadWebsiteAgentFields } from '@/lib/website-agent-fields'
import { generateAiReply } from '@/lib/ai/provider'
import { toChatMessages } from '@/lib/ai/knowledge'
import { buildMarketingSystemPrompt, getMarketingKnowledgeCache } from '@/lib/marketing-ai-setup'
import { MARKETING_WIDGET_DISPLAY_NAME } from '@/lib/marketing-demo-agents'
import { PLATFORM_AI_MODEL } from '@/lib/ai/platform-config'
import { emitBotMessage } from '@/lib/socket-events'
import { rateLimitByIp, rateLimitResponse } from '@/lib/rate-limit'

export const maxDuration = 30

const MARKETING_HISTORY_LIMIT = 8
const MARKETING_MAX_TOKENS = 700

const bodySchema = z.object({
  websiteId: z.string(),
  conversationId: z.string(),
  fingerprint: z.string().min(8).max(128),
})

function sse(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(req: Request) {
  const limited = rateLimitByIp(req, 'widget-reply-stream', 120, 60_000)
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
  }

  const website = await findWebsiteForWidget(parsed.websiteId)
  if (!website) {
    return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
  }

  // Bu endpoint yalnızca platform pazarlama sitesi (gulivechat.com) için.
  if (!(await isPlatformMarketingWebsiteId(website.websiteId))) {
    return new NextResponse(null, { status: 204 })
  }

  const visitor = await prisma.visitor.findUnique({
    where: {
      websiteId_fingerprint: { websiteId: website.id, fingerprint: parsed.fingerprint },
    },
    select: { id: true },
  })
  if (!visitor) {
    return NextResponse.json({ error: 'Ziyaretçi bulunamadı' }, { status: 404 })
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: parsed.conversationId, websiteId: website.id, visitorId: visitor.id },
    select: { id: true },
  })
  if (!conversation) {
    return NextResponse.json({ error: 'Konuşma bulunamadı' }, { status: 404 })
  }

  const agentFields = await loadWebsiteAgentFields(website.id)
  const identity = resolveWidgetAgentIdentity({
    websiteName: website.name || 'Destek',
    agentDisplayName: agentFields.agentDisplayName,
    agentTitle: agentFields.agentTitle,
    avatarUrl: website.avatarUrl,
    isMarketing: true,
  })

  const recent = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    take: MARKETING_HISTORY_LIMIT,
    select: { content: true, senderType: true, createdAt: true },
  })
  const ordered = recent.reverse()
  const lastVisitor = [...ordered].reverse().find((m) => m.senderType === 'VISITOR')

  // Çift yanıt koruması: son ziyaretçi mesajından sonra zaten bot yanıtı
  // verilmişse onu tek seferde gönder (yenileme/yeniden deneme durumları).
  if (lastVisitor) {
    const existingBot = await prisma.message.findFirst({
      where: {
        conversationId: conversation.id,
        senderType: 'BOT',
        createdAt: { gte: lastVisitor.createdAt },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, content: true, createdAt: true },
    })
    if (existingBot?.content?.trim()) {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const enc = new TextEncoder()
          controller.enqueue(enc.encode(sse({ delta: existingBot.content })))
          controller.enqueue(
            enc.encode(
              sse({
                done: true,
                id: existingBot.id,
                content: existingBot.content,
                senderName: identity.replyName,
                senderImage: identity.avatarUrl,
                createdAt: existingBot.createdAt.toISOString(),
              }),
            ),
          )
          controller.close()
        },
      })
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      })
    }
  }

  const messages = toChatMessages(ordered)
  const knowledge = getMarketingKnowledgeCache()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder()
      try {
        if (messages.length === 0) {
          controller.close()
          return
        }

        // Free-tier Gemini'de canlı SSE parça parça kesilebildiği için tam
        // yanıtı tek seferde (model zinciri + 429 yedeği ile) alıp istemciye
        // parça parça yazdırıyoruz → cevap asla yarım kalmaz, typewriter hissi korunur.
        const content = (
          await generateAiReply({
            siteName: identity.replyName,
            messages,
            knowledge,
            systemPrompt: buildMarketingSystemPrompt(agentFields.agentDisplayName),
            webSearchEnabled: false,
            smartRoutingEnabled: false,
            dbConfig: {
              provider: 'GEMINI',
              model: PLATFORM_AI_MODEL,
              apiKey: '',
              temperature: 0.85,
            },
            plan: 'BUSINESS',
            websiteId: website.id,
            conversationId: conversation.id,
            maxTokens: MARKETING_MAX_TOKENS,
            brandName: MARKETING_WIDGET_DISPLAY_NAME,
          })
        ).trim()

        if (!content) {
          controller.close()
          return
        }

        // Kelime kelime gönder (typewriter etkisi için küçük gruplar).
        let buf = ''
        for (const token of content.split(/(\s+)/)) {
          buf += token
          if (buf.length >= 16) {
            controller.enqueue(enc.encode(sse({ delta: buf })))
            buf = ''
            await new Promise((r) => setTimeout(r, 35))
          }
        }
        if (buf) controller.enqueue(enc.encode(sse({ delta: buf })))

        const botMessage = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            content,
            type: 'TEXT',
            senderType: 'BOT',
            status: 'SENT',
          },
        })

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
            lastMessagePreview: content.substring(0, 100),
            chatbotCompleted: true,
            chatbotHandedToAi: true,
          },
        })

        emitBotMessage({
          conversationId: conversation.id,
          websiteId: website.websiteId,
          message: {
            id: botMessage.id,
            content: botMessage.content,
            senderName: identity.replyName,
            senderImage: identity.avatarUrl,
            createdAt: botMessage.createdAt,
          },
        })

        controller.enqueue(
          enc.encode(
            sse({
              done: true,
              id: botMessage.id,
              content: botMessage.content,
              senderName: identity.replyName,
              senderImage: identity.avatarUrl,
              createdAt: botMessage.createdAt.toISOString(),
            }),
          ),
        )
      } catch (err) {
        console.error('[widget/reply/stream] failed:', err)
        try {
          controller.enqueue(enc.encode(sse({ error: true })))
        } catch {
          /* controller kapanmış olabilir */
        }
      } finally {
        try {
          controller.close()
        } catch {
          /* zaten kapalı */
        }
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
