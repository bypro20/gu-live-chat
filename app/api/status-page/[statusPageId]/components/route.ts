import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _req: Request,
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

  const components = await prisma.statusPageComponent.findMany({
    where: { statusPageId },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(components)
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
    const maxOrder = await prisma.statusPageComponent.findFirst({
      where: { statusPageId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const component = await prisma.statusPageComponent.create({
      data: {
        statusPageId,
        name: body.name,
        description: body.description || '',
        groupName: body.groupName || '',
        order: (maxOrder?.order ?? -1) + 1,
        status: 'OPERATIONAL',
      },
    })

    return NextResponse.json(component, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Bileşen oluşturulamadı' }, { status: 500 })
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
    const { id, name, description, status, order, groupName } = body

    if (!id) {
      return NextResponse.json({ error: 'Bileşen ID gerekli' }, { status: 400 })
    }

    const component = await prisma.statusPageComponent.findFirst({
      where: { id, statusPageId },
    })
    if (!component) {
      return NextResponse.json({ error: 'Bileşen bulunamadı' }, { status: 404 })
    }

    const updated = await prisma.statusPageComponent.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(order !== undefined && { order }),
        ...(groupName !== undefined && { groupName }),
      },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Bileşen güncellenemedi' }, { status: 500 })
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
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Bileşen ID gerekli' }, { status: 400 })
    }

    const component = await prisma.statusPageComponent.findFirst({
      where: { id, statusPageId },
    })
    if (!component) {
      return NextResponse.json({ error: 'Bileşen bulunamadı' }, { status: 404 })
    }

    await prisma.statusPageComponent.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Bileşen silinemedi' }, { status: 500 })
  }
}
