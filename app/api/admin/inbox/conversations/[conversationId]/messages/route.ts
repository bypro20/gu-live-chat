import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { sendMessageSchema } from '@/lib/validators/message'
import { resolveAdminInboxSite } from '@/lib/admin-inbox-setup'
import { emitAgentMessage } from '@/lib/socket-events'

async function getAdminInboxWebsite(adminUserId: string) {
  const site = await resolveAdminInboxSite(adminUserId)
  return { id: site.id, websiteId: site.websiteId }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const { conversationId } = await params
    const website = await getAdminInboxWebsite(check.user.id)
    if (!website) {
      return NextResponse.json({ error: 'Marketing sitesi bulunamadı' }, { status: 404 })
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, websiteId: website.id },
      select: { id: true },
    })
    if (!conversation) {
      return NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 })
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    })

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      messages: messages.reverse(),
      total: messages.length,
    })
  } catch (error) {
    console.error('[Admin inbox messages GET] error:', error)
    return NextResponse.json({ error: 'Mesajlar yüklenemedi' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const { conversationId } = await params
    const website = await getAdminInboxWebsite(check.user.id)
    if (!website) {
      return NextResponse.json({ error: 'Marketing sitesi bulunamadı' }, { status: 404 })
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, websiteId: website.id },
      include: { website: { select: { websiteId: true } } },
    })
    if (!conversation) {
      return NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 })
    }

    const body = await req.json()
    const validated = sendMessageSchema.parse(body)

    const message = await prisma.message.create({
      data: {
        conversationId,
        content: validated.content,
        type: validated.type,
        senderType: 'AGENT',
        senderId: check.user.id,
        status: 'SENT',
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        attachments: true,
      },
    })

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
        senderId: check.user.id,
        senderName: message.sender?.name || 'Admin',
        createdAt: message.createdAt,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('[Admin inbox messages POST] error:', error)
    return NextResponse.json({ error: 'Mesaj gönderilemedi' }, { status: 500 })
  }
}
