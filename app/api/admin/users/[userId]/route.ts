import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const { userId } = await params
    const body = await req.json()
    const { role } = body

    if (!['ADMIN', 'USER'].includes(role)) {
      return NextResponse.json({ error: 'Geçersiz rol' }, { status: 400 })
    }

    // Prevent self-demotion
    if (userId === session.user.id && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Kendi admin yetkinizi kaldıramazsınız' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Admin update user error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}