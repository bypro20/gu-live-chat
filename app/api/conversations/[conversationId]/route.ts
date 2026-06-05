import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getIO } from '@/lib/socket'
import { updateConversationSchema } from '@/lib/validators/conversation'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { conversationId } = await params

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      visitor: true,
      assignedTo: { select: { id: true, name: true, image: true } },
      tags: { include: { tag: true } },
      notes: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: 'desc' },
      },
      messages: {
        include: {
          sender: { select: { id: true, name: true, image: true } },
          attachments: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!conversation) {
    return NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 })
  }

  // Verify access
  const member = await prisma.teamMember.findFirst({
    where: {
      websiteId: conversation.websiteId,
      userId: session.user.id,
    },
  })

  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  // Reset unread count for this agent
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { unreadCount: 0 },
  })

  return NextResponse.json(conversation)
}

export async function PATCH(
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
    const validated = updateConversationSchema.parse(body)

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...validated,
        closedAt: validated.status === 'CLOSED' || validated.status === 'RESOLVED'
          ? new Date()
          : undefined,
      },
    })

    return NextResponse.json(conversation)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      )
    }
    console.error('Update conversation error:', error)
    return NextResponse.json({ error: 'Sohbet güncellenemedi' }, { status: 500 })
  }
}