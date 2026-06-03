import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// DELETE /api/notifications/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { id } = await params

  const notification = await prisma.notification.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!notification) {
    return NextResponse.json({ error: 'Bildirim bulunamadı' }, { status: 404 })
  }

  if (notification.userId !== session.user.id) {
    return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
  }

  await prisma.notification.delete({ where: { id } })

  return NextResponse.json({ success: true })
}