import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'
import { z } from 'zod'

const ratingSchema = z.object({
  conversationId: z.string(),
  websiteId: z.string(),
  fingerprint: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
})

// POST /api/widget/ratings — Public endpoint for visitor CSAT (no session required)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = ratingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
    }

    const { conversationId, websiteId, fingerprint, rating, comment } = parsed.data

    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, plan: true },
    })
    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'ratings')
    if (planDenied) return planDenied

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        websiteId: website.id,
        visitor: { fingerprint },
      },
      select: { id: true, websiteId: true, status: true },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Sohbet bulunamadı' }, { status: 404 })
    }

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
  } catch (error) {
    console.error('[Widget Ratings] Error:', error)
    return NextResponse.json({ error: 'Puanlama kaydedilemedi' }, { status: 500 })
  }
}
