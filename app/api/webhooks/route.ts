import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'
import { z } from 'zod'
import crypto from 'crypto'

const webhookSchema = z.object({
  websiteId: z.string(),
  url: z.string().url('Geçerli bir URL girin'),
  events: z.array(z.string()).min(1, 'En az bir olay seçin'),
  isActive: z.boolean().default(true),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteIdParam = searchParams.get('websiteId')
  if (!websiteIdParam) return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })

  const website = await resolveWebsite(websiteIdParam)
  if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'webhooks')
  if (planDenied) return planDenied

  const webhooks = await prisma.webhook.findMany({
    where: { websiteId: website.id },
    include: { events: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(webhooks)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validated = webhookSchema.parse(body)

    const website = await resolveWebsite(validated.websiteId)
    if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: website.id, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) return NextResponse.json({ error: 'Webhook oluşturma yetkiniz yok' }, { status: 403 })

    const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'webhooks')
    if (planDenied) return planDenied

    const secret = crypto.randomBytes(32).toString('hex')

    const webhook = await prisma.webhook.create({
      data: {
        websiteId: website.id,
        url: validated.url,
        secret,
        isActive: validated.isActive,
        events: {
          create: validated.events.map((event: string) => ({ event })),
        },
      },
      include: { events: true },
    })

    return NextResponse.json(webhook, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Webhook oluşturulamadı' }, { status: 500 })
  }
}