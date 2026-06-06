import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { emitVisitorMessage } from '@/lib/socket-events'
import { notifyNewConversation, notifyWebsiteMembers } from '@/lib/notifications'
import { dispatchWebhooks } from '@/lib/webhook-dispatcher'
import { runChatbotForNewConversation } from '@/lib/chatbot-runner'
import { runWorkflows } from '@/lib/workflow-runner'
import { getClientIp } from '@/lib/ip-utils'
import { isIpBanned } from '@/lib/ip-ban'

const widgetMessageSchema = z.object({
  websiteId: z.string(),
  conversationId: z.string().nullable().optional(),
  content: z.string().min(1).max(5000),
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
  visitorName: z.string().optional(),
  visitorEmail: z.string().email().optional().or(z.literal('')),
  fingerprint: z.string(),
})

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req)
    if (await isIpBanned(clientIp)) {
      return NextResponse.json({ error: 'Erişim engellendi' }, { status: 403 })
    }

    const body = await req.json()
    const validated = widgetMessageSchema.parse(body)

    // Find website
    const website = await prisma.website.findUnique({
      where: { websiteId: validated.websiteId },
    })

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

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        content: validated.content,
        type: validated.type,
        senderType: 'VISITOR',
        status: 'SENT',
      },
    })

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: validated.content.substring(0, 100),
        unreadCount: { increment: 1 },
      },
    })

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

    const visitorName = visitor.name || visitor.email?.split('@')[0] || 'Ziyaretçi'

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
      const priorConversations = await prisma.conversation.count({
        where: { visitorId: visitor.id, websiteId: website.id },
      })
      await runChatbotForNewConversation({
        websiteDbId: website.id,
        websitePublicId: website.websiteId,
        conversationId,
        visitorId: visitor.id,
        isFirstVisit: priorConversations <= 1,
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

    return NextResponse.json({
      message,
      conversationId,
    }, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
    }
    console.error('Widget message error:', error)
    return NextResponse.json({ error: 'Mesaj gönderilemedi' }, { status: 500 })
  }
}