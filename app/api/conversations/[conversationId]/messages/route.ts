import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendMessageSchema } from '@/lib/validators/message'
import { emitAgentMessage } from '@/lib/socket-events'
import { notifyWebsiteMembers } from '@/lib/notifications'
import { dispatchWebhooks } from '@/lib/webhook-dispatcher'
import { runWorkflows } from '@/lib/workflow-runner'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { conversationId } = await params
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const limit = parseInt(searchParams.get('limit') || '50')

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      attachments: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = messages.length > limit
  const items = hasMore ? messages.slice(0, -1) : messages

  return NextResponse.json({
    messages: items.reverse(),
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { conversationId } = await params

  try {
    const body = await req.json()
    const validated = sendMessageSchema.parse(body)

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { website: { select: { id: true, websiteId: true } } },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 })
    }

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: conversation.websiteId, userId: session.user.id },
    })

    if (!member) {
      return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        content: validated.content,
        type: validated.type,
        senderType: 'AGENT',
        senderId: session.user.id,
        status: 'SENT',
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        attachments: true,
      },
    })

    // Update conversation's lastMessageAt and preview
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: validated.content.substring(0, 100),
      },
    })

    emitAgentMessage({
      conversationId,
      websiteId: conversation.website.websiteId,
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        senderId: session.user.id,
        senderName: message.sender?.name || 'Temsilci',
        createdAt: message.createdAt,
      },
    })

    const agentName = message.sender?.name || 'Temsilci'
    await notifyWebsiteMembers({
      websiteId: conversation.websiteId,
      type: 'NEW_MESSAGE',
      title: 'Yeni mesaj',
      message: `${agentName} bir mesaj gönderdi`,
      data: { conversationId },
      excludeUserId: session.user.id,
    })

    await dispatchWebhooks(conversation.websiteId, 'message.sent', {
      conversationId,
      messageId: message.id,
      content: message.content,
      senderId: session.user.id,
      senderName: agentName,
    })

    await runWorkflows('MESSAGE_RECEIVED', {
      websiteDbId: conversation.websiteId,
      websitePublicId: conversation.website.websiteId,
      conversationId,
      messageContent: message.content,
      senderType: 'AGENT',
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Geçersiz mesaj', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      )
    }
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Mesaj gönderilemedi' }, { status: 500 })
  }
}