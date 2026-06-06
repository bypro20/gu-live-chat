import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'
import { z } from 'zod'

const channelSchema = z.object({
  websiteId: z.string(),
  type: z.enum(['WHATSAPP', 'EMAIL', 'MESSENGER', 'INSTAGRAM', 'TELEGRAM', 'SLACK', 'SMS']),
  name: z.string().min(1, 'Kanal adı gerekli'),
  config: z.string().optional(),
  isActive: z.boolean().default(false),
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
    where: { websiteId: website.id, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'multiChannel')
  if (planDenied) return planDenied

  const channels = await prisma.channelIntegration.findMany({
    where: { websiteId: website.id },
    orderBy: { type: 'asc' },
  })

  return NextResponse.json(channels)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validated = channelSchema.parse(body)

    const website = await resolveWebsite(validated.websiteId)
    if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: website.id, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) return NextResponse.json({ error: 'Kanal ekleme yetkiniz yok' }, { status: 403 })

    const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'multiChannel')
    if (planDenied) return planDenied

    const existing = await prisma.channelIntegration.findUnique({
      where: { websiteId_type: { websiteId: website.id, type: validated.type } },
    })
    if (existing) return NextResponse.json({ error: 'Bu kanal zaten mevcut' }, { status: 409 })

    const channel = await prisma.channelIntegration.create({
      data: { ...validated, websiteId: website.id },
    })

    return NextResponse.json(channel, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    console.error('Create channel error:', error)
    return NextResponse.json({ error: 'Kanal eklenemedi' }, { status: 500 })
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
    if (!id) return NextResponse.json({ error: 'Kanal ID gerekli' }, { status: 400 })

    const channel = await prisma.channelIntegration.findUnique({
      where: { id },
      include: { website: { select: { id: true, plan: true } } },
    })
    if (!channel) return NextResponse.json({ error: 'Kanal bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: channel.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })

    const planDenied = await planFeatureDeniedAsync(channel.website.id, channel.website.plan, 'multiChannel')
    if (planDenied) return planDenied

    const updated = await prisma.channelIntegration.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    console.error('Update channel error:', error)
    return NextResponse.json({ error: 'Kanal güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Kanal ID gerekli' }, { status: 400 })

  const channel = await prisma.channelIntegration.findUnique({
    where: { id },
    include: { website: { select: { id: true, plan: true } } },
  })
  if (!channel) return NextResponse.json({ error: 'Kanal bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: channel.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })

  const planDenied = await planFeatureDeniedAsync(channel.website.id, channel.website.plan, 'multiChannel')
  if (planDenied) return planDenied

  await prisma.channelIntegration.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
