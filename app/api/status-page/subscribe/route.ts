import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { rateLimitByIp, rateLimitResponse } from '@/lib/rate-limit'

const schema = z.object({
  subdomain: z.string().min(1),
  email: z.string().email(),
})

export async function POST(req: Request) {
  try {
    const limited = rateLimitByIp(req, 'status-subscribe', 10, 60_000)
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
    }

    const page = await prisma.statusPage.findUnique({
      where: { subdomain: parsed.data.subdomain },
      select: { id: true, isActive: true },
    })
    if (!page?.isActive) {
      return NextResponse.json({ error: 'Durum sayfası bulunamadı' }, { status: 404 })
    }

    await prisma.statusPageSubscriber.upsert({
      where: {
        statusPageId_email: {
          statusPageId: page.id,
          email: parsed.data.email,
        },
      },
      create: {
        statusPageId: page.id,
        email: parsed.data.email,
      },
      update: { isActive: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Status Subscribe]', error)
    return NextResponse.json({ error: 'Abonelik kaydedilemedi' }, { status: 500 })
  }
}
