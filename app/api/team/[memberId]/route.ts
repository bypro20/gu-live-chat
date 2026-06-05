import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { memberId } = await params

  try {
    const body = await req.json()
    const { role } = body

    if (!role || !['OWNER', 'ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json({ error: 'Geçersiz rol' }, { status: 400 })
    }

    const member = await prisma.teamMember.findUnique({ where: { id: memberId } })
    if (!member) {
      return NextResponse.json({ error: 'Üye bulunamadı' }, { status: 404 })
    }

    // Check permission
    const requester = await prisma.teamMember.findFirst({
      where: { websiteId: member.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })

    if (!requester) {
      return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update member error:', error)
    return NextResponse.json({ error: 'Üye güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { memberId } = await params

  const member = await prisma.teamMember.findUnique({ where: { id: memberId } })
  if (!member) {
    return NextResponse.json({ error: 'Üye bulunamadı' }, { status: 404 })
  }

  // Check permission
  const requester = await prisma.teamMember.findFirst({
    where: { websiteId: member.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
  })

  if (!requester) {
    return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })
  }

  // Can't remove owner
  if (member.role === 'OWNER') {
    return NextResponse.json({ error: 'Sahip rolündeki üye kaldırılamaz' }, { status: 403 })
  }

  await prisma.teamMember.delete({ where: { id: memberId } })

  return NextResponse.json({ success: true })
}