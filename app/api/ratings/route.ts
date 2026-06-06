import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { resolveWebsite } from '@/lib/website-resolve'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { conversationId, rating, comment } = body

    if (!conversationId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Geçersiz puan (1-5 arası olmalı)' }, { status: 400 })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { websiteId: true, status: true, website: { select: { id: true, plan: true } } },
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

    const planDenied = await planFeatureDeniedAsync(conversation.website.id, conversation.website.plan, 'ratings')
    if (planDenied) return planDenied

    if (conversation.status !== 'RESOLVED' && conversation.status !== 'CLOSED') {
      return NextResponse.json({ error: 'Yalnızca çözülen sohbetler puanlanabilir' }, { status: 400 })
    }

    const existing = await prisma.conversationRating.findUnique({
      where: { conversationId },
    })

    if (existing) {
      return NextResponse.json({ error: 'Bu sohbet zaten puanlandı' }, { status: 409 })
    }

    const created = await prisma.conversationRating.create({
      data: {
        conversationId,
        websiteId: conversation.websiteId,
        rating,
        comment: comment || null,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Puanlama kaydedilemedi' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteIdParam = searchParams.get('websiteId')

  if (!websiteIdParam) {
    return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
  }

  const website = await resolveWebsite(websiteIdParam)
  if (!website) {
    return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
  }

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id },
  })

  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'ratings')
  if (planDenied) return planDenied

  const ratings = await prisma.conversationRating.findMany({
    where: { websiteId: website.id },
    include: {
      conversation: {
        select: {
          id: true,
          visitor: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { ratedAt: 'desc' },
  })

  return NextResponse.json(ratings)
}
