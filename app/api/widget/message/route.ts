import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { emitVisitorMessage } from '@/lib/socket-events'
import { notifyNewConversation, notifyWebsiteMembers } from '@/lib/notifications'
import { dispatchWebhooks } from '@/lib/webhook-dispatcher'
import { processChatbotOnVisitorMessage } from '@/lib/chatbot-runner'
import { runWorkflows } from '@/lib/workflow-runner'
import { maybeRunAiAutoReply } from '@/lib/ai/auto-reply'
import { analyzeSentiment } from '@/lib/ai/sentiment'
import { getClientIp } from '@/lib/ip-utils'
import { isIpBanned } from '@/lib/ip-ban'
import { canCreateConversation } from '@/lib/plan-limits'
import { resolveAgentsOnline } from '@/lib/agents-online'
import { findWebsiteForWidget } from '@/lib/website-widget-safe'

const widgetAttachmentSchema = z.object({
  url: z.string().min(1).max(2000),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().nonnegative().optional(),
  mimeType: z.string().max(255).optional(),
})

const widgetMessageSchema = z.object({
  websiteId: z.string(),
  conversationId: z.string().nullable().optional(),
  content: z.string().min(1).max(5000),
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
  visitorName: z.string().optional(),
  visitorEmail: z.string().email().optional().or(z.literal('')),
  fingerprint: z.string(),
  visitorLang: z.string().min(2).max(8).optional(),
  attachment: widgetAttachmentSchema.optional(),
})

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req)
    if (await isIpBanned(clientIp)) {
      return NextResponse.json({ error: 'Erişim engellendi' }, { status: 403 })
    }

    const body = await req.json()
    const validated = widgetMessageSchema.parse(body)

    const website = await findWebsiteForWidget(validated.websiteId)
    if (!website) {
      return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
    }

    // Find or create visitor
    let visitor = await prisma.visitor.findUnique({
      where: {
        websiteId_fingerprint: {
          websiteId: website.id,
          fingerprint: validated.fingerprint,
        },
      },
    })

    if (!visitor) {
      visitor = await prisma.visitor.create({
        data: {
          websiteId: website.id,
          fingerprint: validated.fingerprint,
          name: validated.visitorName || null,
          email: validated.visitorEmail || null,
        },
      })
    } else if (validated.visitorName || validated.visitorEmail) {
      visitor = await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          ...(validated.visitorName ? { name: validated.visitorName } : {}),
          ...(validated.visitorEmail ? { email: validated.visitorEmail } : {}),
        },
      })
    }

    // Find or create conversation
    let conversationId = validated.conversationId
    let isNewConversation = false

    // If the client supplied a conversationId, it must actually belong to this
    // website AND this visitor. Otherwise a malicious visitor could append
    // messages to another tenant's conversation (cross-tenant IDOR write).
    if (conversationId) {
      const owned = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          websiteId: website.id,
          visitorId: visitor.id,
        },
        select: { id: true },
      })
      if (!owned) {
        // Ignore the spoofed id and fall back to the find-or-create flow below.
        conversationId = null
      }
    }

    if (!conversationId) {
      // Check for open conversation
      const existing = await prisma.conversation.findFirst({
        where: {
          visitorId: visitor.id,
          websiteId: website.id,
          status: { in: ['OPEN', 'PENDING'] },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (existing) {
        conversationId = existing.id
      } else {
        // Plan limit check before creating a new conversation
        const limitCheck = await canCreateConversation(website.websiteId)
        if (!limitCheck.allowed) {
          return NextResponse.json(
            {
              error: 'Aylık konuşma limitine ulaşıldı',
              limit: limitCheck.limit,
              current: limitCheck.current,
            },
            { status: 429 }
          )
        }

        // Create new conversation
        const conversation = await prisma.conversation.create({
          data: {
            websiteId: website.id,
            visitorId: visitor.id,
            status: 'OPEN',
            source: 'WIDGET',
            lastMessageAt: new Date(),
            lastMessagePreview: validated.content.substring(0, 100),
          },
        })
        conversationId = conversation.id
        isNewConversation = true
      }
    }

    const sentiment = analyzeSentiment(validated.content)

    // Create message (with an attachment when the visitor sent a file/image).
    const message = await prisma.message.create({
      data: {
        conversationId,
        content: validated.content,
        type: validated.type,
        senderType: 'VISITOR',
        status: 'SENT',
        sentiment,
        ...(validated.attachment
          ? {
              attachments: {
                create: {
                  url: validated.attachment.url,
                  fileName: validated.attachment.fileName,
                  fileSize: validated.attachment.fileSize ?? null,
                  mimeType: validated.attachment.mimeType ?? null,
                },
              },
            }
          : {}),
      },
      include: { attachments: true },
    })

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: validated.content.substring(0, 100),
        unreadCount: { increment: 1 },
        ...(validated.visitorLang ? { visitorLang: validated.visitorLang } : {}),
      },
    })

    const visitorName = visitor.name || visitor.email?.split('@')[0] || 'Ziyaretçi'
    const responseBody = { message, conversationId }

    // Yanıtı hemen döndür — chatbot/AI/webhook beklemesin (widget mesaj kaybını önler)
    void (async () => {
      try {
        emitVisitorMessage({
          conversationId,
          websiteId: website.websiteId,
          message: {
            id: message.id,
            content: message.content,
            type: message.type,
            visitorId: visitor.id,
            createdAt: message.createdAt,
          },
          isNewConversation,
        })

        if (isNewConversation) {
          await notifyNewConversation(website.id, visitorName, conversationId)
          await dispatchWebhooks(website.id, 'conversation.created', {
            conversationId,
            visitorId: visitor.id,
            visitorName,
            source: 'WIDGET',
          })
          await runWorkflows('CONVERSATION_CREATED', {
            websiteDbId: website.id,
            websitePublicId: website.websiteId,
            conversationId,
            visitorId: visitor.id,
          })
        } else {
          await notifyWebsiteMembers({
            websiteId: website.id,
            type: 'NEW_MESSAGE',
            title: 'Yeni mesaj',
            message: `${visitorName} bir mesaj gönderdi`,
            data: { conversationId },
          })
        }

        await dispatchWebhooks(website.id, 'message.received', {
          conversationId,
          messageId: message.id,
          content: message.content,
          visitorId: visitor.id,
          visitorName,
        })

        await runWorkflows('MESSAGE_RECEIVED', {
          websiteDbId: website.id,
          websitePublicId: website.websiteId,
          conversationId,
          visitorId: visitor.id,
          messageContent: message.content,
          senderType: 'VISITOR',
        })

        const priorConversations = await prisma.conversation.count({
          where: { visitorId: visitor.id, websiteId: website.id },
        })

        const agentsOnline = await resolveAgentsOnline(website.websiteId, website.id)

        await processChatbotOnVisitorMessage({
          websiteDbId: website.id,
          websitePublicId: website.websiteId,
          conversationId,
          visitorId: visitor.id,
          messageContent: validated.content,
          isFirstVisit: priorConversations <= 1,
          agentsOnline,
        })

        await maybeRunAiAutoReply({
          websiteDbId: website.id,
          websitePublicId: website.websiteId,
          conversationId,
          visitorId: visitor.id,
        })
      } catch (postErr) {
        console.error('[widget/message] post-process failed (message saved):', postErr)
      }
    })()

    return NextResponse.json(responseBody, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
    }
    console.error('Widget message error:', error)
    return NextResponse.json({ error: 'Mesaj gönderilemedi' }, { status: 500 })
  }
}