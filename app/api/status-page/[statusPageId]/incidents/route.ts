import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ statusPageId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { statusPageId } = await params

  const page = await prisma.statusPage.findUnique({
    where: { id: statusPageId },
    include: { website: { select: { id: true, plan: true } } },
  })
  if (!page) {
    return NextResponse.json({ error: 'Sayfa bulunamadı' }, { status: 404 })
  }

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: page.websiteId, userId: session.user.id },
  })
  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  const planDenied = await planFeatureDeniedAsync(page.website.id, page.website.plan, 'statusPage')
  if (planDenied) return planDenied

  const incidents = await prisma.incident.findMany({
    where: { statusPageId },
    include: { updates: { orderBy: { createdAt: 'desc' } } },
    orderBy: { startedAt: 'desc' },
  })

  return NextResponse.json(incidents)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ statusPageId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { statusPageId } = await params

  const page = await prisma.statusPage.findUnique({ where: { id: statusPageId } })
  if (!page) {
    return NextResponse.json({ error: 'Sayfa bulunamadı' }, { status: 404 })
  }

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: page.websiteId, userId: session.user.id },
  })
  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { title, message, severity, components: affectedComponents } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Başlık ve mesaj gerekli' }, { status: 400 })
    }

    const incident = await prisma.incident.create({
      data: {
        statusPageId,
        title,
        message,
        severity: severity || 'MEDIUM',
        status: 'INVESTIGATING',
        components: affectedComponents ? JSON.stringify(affectedComponents) : null,
        updates: {
          create: {
            status: 'INVESTIGATING',
            message,
          },
        },
      },
      include: { updates: { orderBy: { createdAt: 'desc' } } },
    })

    return NextResponse.json(incident, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Olay oluşturulamadı' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ statusPageId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { statusPageId } = await params

  const page = await prisma.statusPage.findUnique({ where: { id: statusPageId } })
  if (!page) {
    return NextResponse.json({ error: 'Sayfa bulunamadı' }, { status: 404 })
  }

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: page.websiteId, userId: session.user.id },
  })
  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { id, title, status, severity, message } = body

    if (!id) {
      return NextResponse.json({ error: 'Olay ID gerekli' }, { status: 400 })
    }

    const incident = await prisma.incident.findFirst({
      where: { id, statusPageId },
    })
    if (!incident) {
      return NextResponse.json({ error: 'Olay bulunamadı' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (severity !== undefined) updateData.severity = severity
    if (status !== undefined) {
      updateData.status = status
      if (status === 'RESOLVED') {
        updateData.resolvedAt = new Date()
      }
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: updateData,
    })

    if (status && message) {
      await prisma.incidentUpdate.create({
        data: {
          incidentId: id,
          status,
          message,
        },
      })
    }

    const result = await prisma.incident.findUnique({
      where: { id },
      include: { updates: { orderBy: { createdAt: 'desc' } } },
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Olay güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ statusPageId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { statusPageId } = await params

  const page = await prisma.statusPage.findUnique({ where: { id: statusPageId } })
  if (!page) {
    return NextResponse.json({ error: 'Sayfa bulunamadı' }, { status: 404 })
  }

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: page.websiteId, userId: session.user.id },
  })
  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Olay ID gerekli' }, { status: 400 })
    }

    const incident = await prisma.incident.findFirst({
      where: { id, statusPageId },
    })
    if (!incident) {
      return NextResponse.json({ error: 'Olay bulunamadı' }, { status: 404 })
    }

    await prisma.incident.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Olay silinemedi' }, { status: 500 })
  }
}
