import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'

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
  if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'proactiveMessages')
  if (planDenied) return planDenied

  const messages = await prisma.proactiveMessage.findMany({
    where: { websiteId: website.id, isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(messages)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const body = await req.json()
  const { websiteId: websiteIdParam, title, message, triggerType, triggerValue, targetPages, isActive, delay, showOnce } = body

  if (!websiteIdParam || !title || !message || !triggerType) {
    return NextResponse.json({ error: 'Eksik alanlar: websiteId, title, message, triggerType' }, { status: 400 })
  }

  const website = await resolveWebsite(websiteIdParam)
  if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })

  const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'proactiveMessages')
  if (planDenied) return planDenied

  const proactive = await prisma.proactiveMessage.create({
    data: {
      websiteId: website.id,
      title,
      message,
      triggerType,
      triggerValue: triggerValue || null,
      targetPages: targetPages || null,
      isActive: isActive ?? true,
      delay: delay ?? 0,
      showOnce: showOnce ?? true,
    },
  })

  return NextResponse.json(proactive)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const body = await req.json()
  const { id, title, message, triggerType, triggerValue, targetPages, isActive, delay, showOnce } = body

  if (!id) {
    return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
  }

  const existing = await prisma.proactiveMessage.findUnique({
    where: { id },
    include: { website: { select: { id: true, plan: true } } },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Proaktif mesaj bulunamadı' }, { status: 404 })
  }

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: existing.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  const planDenied = await planFeatureDeniedAsync(existing.website.id, existing.website.plan, 'proactiveMessages')
  if (planDenied) return planDenied

  const proactive = await prisma.proactiveMessage.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(message !== undefined && { message }),
      ...(triggerType !== undefined && { triggerType }),
      ...(triggerValue !== undefined && { triggerValue }),
      ...(targetPages !== undefined && { targetPages }),
      ...(isActive !== undefined && { isActive }),
      ...(delay !== undefined && { delay }),
      ...(showOnce !== undefined && { showOnce }),
    },
  })

  return NextResponse.json(proactive)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id gerekli' }, { status: 400 })
  }

  const existing = await prisma.proactiveMessage.findUnique({
    where: { id },
    include: { website: { select: { id: true, plan: true } } },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Proaktif mesaj bulunamadı' }, { status: 404 })
  }

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: existing.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  const planDenied = await planFeatureDeniedAsync(existing.website.id, existing.website.plan, 'proactiveMessages')
  if (planDenied) return planDenied

  await prisma.proactiveMessage.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
