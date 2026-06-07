import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ visitorId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { visitorId } = await params

  const visitor = await prisma.visitor.findUnique({
    where: { id: visitorId },
    include: {
      conversations: {
        include: {
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
          assignedTo: { select: { id: true, name: true, image: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      sessions: {
        include: { pages: { orderBy: { viewedAt: 'desc' }, take: 20 } },
        orderBy: { startedAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!visitor) {
    return NextResponse.json({ error: 'Ziyaretçi bulunamadı' }, { status: 404 })
  }

  // Verify membership
  const member = await prisma.teamMember.findFirst({
    where: { websiteId: visitor.websiteId, userId: session.user.id },
  })

  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  const { sessions: _sessions, conversations, ...rest } = visitor

  return NextResponse.json({
    ...rest,
    conversations: conversations.map((c) => {
      const lastMsg = c.messages[0]
      return {
        id: c.id,
        status: c.status,
        lastMessageAt: (lastMsg?.createdAt ?? c.createdAt).toISOString(),
        lastMessagePreview: lastMsg?.content?.substring(0, 120) ?? null,
      }
    }),
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ visitorId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { visitorId } = await params

  try {
    const existing = await prisma.visitor.findUnique({
      where: { id: visitorId },
      select: { websiteId: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Ziyaretçi bulunamadı' }, { status: 404 })
    }

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: existing.websiteId, userId: session.user.id },
    })
    if (!member) {
      return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
    }

    const body = await req.json()
    const { name, email, phone, notes, customData } = body

    const visitor = await prisma.visitor.update({
      where: { id: visitorId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(customData !== undefined ? { customData } : {}),
      },
    })

    return NextResponse.json(visitor)
  } catch (error) {
    console.error('Update visitor error:', error)
    return NextResponse.json({ error: 'Ziyaretçi güncellenemedi' }, { status: 500 })
  }
}