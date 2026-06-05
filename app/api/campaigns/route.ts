import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const campaignSchema = z.object({
  websiteId: z.string(),
  name: z.string().min(1, 'Kampanya adı gerekli'),
  description: z.string().optional(),
  type: z.enum(['EMAIL', 'IN_APP', 'BROADCAST']).default('EMAIL'),
  target: z.enum(['ALL_VISITORS', 'ACTIVE_CONVERSATIONS', 'SEGMENTED']).default('ALL_VISITORS'),
  segmentFilter: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  scheduledAt: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('websiteId')
  if (!websiteId) return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const campaigns = await prisma.campaign.findMany({
    where: { websiteId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(campaigns)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validated = campaignSchema.parse(body)

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: validated.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) return NextResponse.json({ error: 'Kampanya oluşturma yetkiniz yok' }, { status: 403 })

    const { scheduledAt, ...data } = validated
    const campaign = await prisma.campaign.create({
      data: {
        ...data,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    console.error('Create campaign error:', error)
    return NextResponse.json({ error: 'Kampanya oluşturulamadı' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, ...updateData } = body
    if (!id) return NextResponse.json({ error: 'Kampanya ID gerekli' }, { status: 400 })

    const campaign = await prisma.campaign.findUnique({ where: { id } })
    if (!campaign) return NextResponse.json({ error: 'Kampanya bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: campaign.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })

    if (updateData.scheduledAt) {
      updateData.scheduledAt = new Date(updateData.scheduledAt)
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    console.error('Update campaign error:', error)
    return NextResponse.json({ error: 'Kampanya güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Kampanya ID gerekli' }, { status: 400 })

  const campaign = await prisma.campaign.findUnique({ where: { id } })
  if (!campaign) return NextResponse.json({ error: 'Kampanya bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: campaign.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })

  await prisma.campaign.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
