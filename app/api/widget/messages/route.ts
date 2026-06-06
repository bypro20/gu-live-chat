import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Public endpoint the chat widget polls to receive new messages (agent/bot
 * replies, etc.) when no realtime socket connection is available — e.g. on
 * Vercel serverless. Access is scoped to the visitor that owns the
 * conversation, verified via their fingerprint.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')
    const fingerprint = searchParams.get('fingerprint')

    if (!conversationId || !fingerprint) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        status: true,
        visitor: { select: { fingerprint: true } },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 })
    }

    // Ensure the requester actually owns this conversation.
    if (conversation.visitor?.fingerprint !== fingerprint) {
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
      })),
    })
  } catch (error) {
    console.error('Widget messages fetch error:', error)
    return NextResponse.json({ error: 'Mesajlar alınamadı' }, { status: 500 })
  }
}
