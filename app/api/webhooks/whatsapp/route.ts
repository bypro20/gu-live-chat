import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { parseIncomingWebhook, markWhatsAppMessageRead, WhatsAppConfig } from '@/lib/channels/whatsapp'
import { emitVisitorMessage } from '@/lib/socket-events'
import { processChatbotOnVisitorMessage } from '@/lib/chatbot-runner'
import { maybeRunAiAutoReply } from '@/lib/ai/auto-reply'
import { analyzeSentiment } from '@/lib/ai/sentiment'
import { websiteHasFeature } from '@/lib/addon-features'

// ─── Webhook Verification (GET) ───────────────────────────────────────
// Meta sends this when you register the webhook URL in the Developer Console.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode !== 'subscribe' || !challenge) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  // Find the integration whose verifyToken matches
  const integrations = await prisma.channelIntegration.findMany({
    where: { type: 'WHATSAPP', isActive: true },
    select: { config: true },
  })

  const matched = integrations.some((i) => {
    try {
      const cfg = JSON.parse(i.config || '{}') as WhatsAppConfig
      return cfg.verifyToken === token
    } catch {
      return false
    }
  })

  if (!matched) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  return new NextResponse(challenge, { status: 200 })
}

// ─── Incoming Messages (POST) ─────────────────────────────────────────
function verifyWhatsAppSignature(rawBody: string, signature: string | null, appSecret: string): boolean {
  if (!signature || !appSecret) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-hub-signature-256')
    const appSecret = process.env.WHATSAPP_APP_SECRET || ''

    if (appSecret && !verifyWhatsAppSignature(rawBody, signature, appSecret)) {
      console.warn('[WhatsApp Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const body = JSON.parse(rawBody)

    // Only process message events
    if (body?.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' })
    }

    const messages = parseIncomingWebhook(body)
    if (messages.length === 0) {
      return NextResponse.json({ status: 'no_messages' })
    }

    // Find the matching integration by phoneNumberId from the payload
    const phoneNumberId = body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id as string | undefined

    const integration = phoneNumberId
      ? await prisma.channelIntegration.findFirst({
          where: { type: 'WHATSAPP', isActive: true },
          include: { website: true },
        }).then(async (fallback) => {
          // Try to match by phoneNumberId first
          const all = await prisma.channelIntegration.findMany({
            where: { type: 'WHATSAPP', isActive: true },
            include: { website: true },
          })
          return (
            all.find((i) => {
              try {
                const cfg = JSON.parse(i.config || '{}') as WhatsAppConfig
                return cfg.phoneNumberId === phoneNumberId
              } catch {
                return false
              }
            }) || fallback
          )
        })
      : await prisma.channelIntegration.findFirst({
          where: { type: 'WHATSAPP', isActive: true },
          include: { website: true },
        })

    if (!integration) {
      console.warn('[WhatsApp Webhook] No matching active integration found')
      return NextResponse.json({ status: 'no_integration' })
    }

    if (!(await websiteHasFeature(integration.websiteId, integration.website.plan, 'multiChannel'))) {
      console.warn('[WhatsApp Webhook] Plan does not include multi-channel for', integration.website.websiteId)
      return NextResponse.json({ status: 'plan_denied' })
    }

    const cfg = JSON.parse(integration.config || '{}') as WhatsAppConfig

    for (const msg of messages) {
      const phone = msg.from
      const content = msg.text || `[${msg.type} mesajı]`
      const fingerprint = `wa_${phone}`

      // Find or create visitor
      let visitor = await prisma.visitor.findUnique({
        where: {
          websiteId_fingerprint: {
            websiteId: integration.websiteId,
            fingerprint,
          },
        },
      })

      if (!visitor) {
        visitor = await prisma.visitor.create({
          data: {
            websiteId: integration.websiteId,
            fingerprint,
            name: phone,
          },
        })
      }

      // Find or create open conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          visitorId: visitor.id,
          websiteId: integration.websiteId,
          status: { in: ['OPEN', 'PENDING'] },
        },
        orderBy: { createdAt: 'desc' },
      })

      let isNewConversation = false
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            websiteId: integration.websiteId,
            visitorId: visitor.id,
            status: 'OPEN',
            source: 'WIDGET', // closest available enum value
            lastMessageAt: new Date(),
            lastMessagePreview: content.substring(0, 100),
          },
        })
        isNewConversation = true
      }

      const sentiment = analyzeSentiment(content)

      // Save message
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content,
          type: msg.type === 'text' ? 'TEXT' : 'FILE',
          senderType: 'VISITOR',
          status: 'SENT',
          sentiment,
        },
      })

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          lastMessagePreview: content.substring(0, 100),
          unreadCount: { increment: 1 },
        },
      })

      emitVisitorMessage({
        conversationId: conversation.id,
        websiteId: integration.website.websiteId,
        message: {
          id: message.id,
          content: message.content,
          type: message.type,
          visitorId: visitor.id,
          createdAt: message.createdAt,
        },
        isNewConversation,
      })

      const priorConversations = await prisma.conversation.count({
        where: { visitorId: visitor.id, websiteId: integration.websiteId },
      })

      const { resolveAgentsOnline } = await import('@/lib/agents-online')
      const agentsOnline = await resolveAgentsOnline(
        integration.website.websiteId,
        integration.websiteId
      )

      await processChatbotOnVisitorMessage({
        websiteDbId: integration.websiteId,
        websitePublicId: integration.website.websiteId,
        conversationId: conversation.id,
        visitorId: visitor.id,
        messageContent: content,
        isFirstVisit: isNewConversation || priorConversations <= 1,
        agentsOnline,
      })

      await maybeRunAiAutoReply({
        websiteDbId: integration.websiteId,
        websitePublicId: integration.website.websiteId,
        conversationId: conversation.id,
        visitorId: visitor.id,
      })

      markWhatsAppMessageRead(cfg, msg.id)
    }

    return NextResponse.json({ status: 'ok', processed: messages.length })
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error)
    // Always return 200 to Meta — otherwise it retries indefinitely
    return NextResponse.json({ status: 'error' }, { status: 200 })
  }
}
