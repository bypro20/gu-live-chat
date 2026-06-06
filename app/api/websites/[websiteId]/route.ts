import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { updateWebsiteSchema } from '@/lib/validators/website'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { websiteId } = await params

  const website = await prisma.website.findFirst({
    where: {
      OR: [{ id: websiteId }, { websiteId }],
      members: {
        some: { userId: session.user.id },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      _count: { select: { conversations: true, visitors: true } },
    },
  })

  if (!website) {
    return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
  }

  return NextResponse.json(website)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { websiteId } = await params

  try {
    const body = await req.json()
    const validated = updateWebsiteSchema.parse(body)

    const target = await prisma.website.findFirst({
      where: { OR: [{ id: websiteId }, { websiteId }] },
      select: { id: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
    }

    // Check permission
    const member = await prisma.teamMember.findFirst({
      where: {
        websiteId: target.id,
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }

    const website = await prisma.website.update({
      where: { id: target.id },
      data: validated,
    })

    return NextResponse.json(website)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      )
    }
    console.error('Update website error:', error)
    return NextResponse.json({ error: 'Website güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { websiteId } = await params

  const target = await prisma.website.findFirst({
    where: { OR: [{ id: websiteId }, { websiteId }] },
    select: { id: true },
  })
  if (!target) {
    return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
  }

  // Only OWNER can delete
  const member = await prisma.teamMember.findFirst({
    where: {
      websiteId: target.id,
      userId: session.user.id,
      role: 'OWNER',
    },
  })

  if (!member) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
  }

  await prisma.website.delete({ where: { id: target.id } })

  return NextResponse.json({ success: true })
}