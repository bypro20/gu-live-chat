import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateConversationSchema } from '@/lib/validators/conversation'
import {
  notifyConversationAssigned,
  notifyConversationResolved,
} from '@/lib/notifications'
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

    const existing = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { website: { select: { id: true, websiteId: true } } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 })
    }

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: existing.websiteId, userId: session.user.id },
    })
    if (!member) {
      return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
    }

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...validated,
        closedAt: validated.status === 'CLOSED' || validated.status === 'RESOLVED'
          ? new Date()
          : undefined,
      },
    })

    const agent = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    })
    const agentName = agent?.name || 'Temsilci'

    if (validated.assignedToId && validated.assignedToId !== existing.assignedToId) {
      await notifyConversationAssigned(
        existing.websiteId,
        conversationId,
        validated.assignedToId,
        agentName
      )
    }

    if (validated.status === 'RESOLVED' && existing.status !== 'RESOLVED') {
      await notifyConversationResolved(
        existing.websiteId,
        conversationId,
        agentName,
        session.user.id
      )
      await dispatchWebhooks(existing.websiteId, 'conversation.resolved', {
        conversationId,
        resolvedBy: session.user.id,
      })
      await runWorkflows('CONVERSATION_RESOLVED', {
        websiteDbId: existing.websiteId,
        websitePublicId: existing.website.websiteId,
        conversationId,
        visitorId: existing.visitorId,
      })
    }

    if (validated.status === 'CLOSED' && existing.status !== 'CLOSED') {
      await dispatchWebhooks(existing.websiteId, 'conversation.closed', {
        conversationId,
        closedBy: session.user.id,
      })
      await runWorkflows('CONVERSATION_CLOSED', {
        websiteDbId: existing.websiteId,
        websitePublicId: existing.website.websiteId,
        conversationId,
        visitorId: existing.visitorId,
      })
    }

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