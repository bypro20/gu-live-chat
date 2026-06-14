import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { resolveVisitorToken } from '@/lib/secure-tokens'
import { rateLimitByIp, rateLimitResponse } from '@/lib/rate-limit'

/**
 * Public endpoint the chat widget polls to receive new messages (agent/bot
 * replies, etc.) when no realtime socket connection is available — e.g. on
 * Vercel serverless. Access is scoped to the visitor that owns the
 * conversation, verified via their fingerprint.
 */
export async function GET(req: Request) {
  try {
    const limited = rateLimitByIp(req, 'widget-messages', 120, 60_000)
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')
    const fingerprint = searchParams.get('fingerprint')
    const visitorToken = searchParams.get('visitorToken')
    const websiteId = searchParams.get('websiteId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    if (process.env.NODE_ENV === 'production') {
      if (!visitorToken) {
        return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
      }
    } else if (!visitorToken && !fingerprint) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const tokenPayload = visitorToken ? resolveVisitorToken(visitorToken) : null
    if (visitorToken && !tokenPayload) {
      return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        status: true,
        visitorId: true,
        visitor: { select: { fingerprint: true } },
        website: { select: { websiteId: true } },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 })
    }

    if (tokenPayload) {
      if (tokenPayload.visitorId !== conversation.visitorId) {
        return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
      }
      if (websiteId && tokenPayload.websiteId !== websiteId) {
        return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
      }
    } else if (fingerprint) {
      if (conversation.visitor?.fingerprint !== fingerprint) {
        return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
    }

    // Reject mismatched tenant when the widget provides its websiteId.
    if (websiteId && conversation.website?.websiteId !== websiteId) {
      return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      select: {
        id: true,
        content: true,
        type: true,
        senderType: true,
        createdAt: true,
        sender: { select: { name: true } },
        attachments: {
          select: { id: true, url: true, fileName: true, fileSize: true, mimeType: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    })

    return NextResponse.json({
      status: conversation.status,
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        type: m.type,
        senderType: m.senderType,
        senderName: m.sender?.name || null,
        createdAt: m.createdAt,
        attachments: m.attachments.map((a) => ({
          id: a.id,
          url: a.url,
          fileName: a.fileName,
          fileSize: a.fileSize,
          mimeType: a.mimeType,
        })),
      })),
    })
  } catch (error) {
    console.error('Widget messages fetch error:', error)
    return NextResponse.json({ error: 'Mesajlar alınamadı' }, { status: 500 })
  }
}
