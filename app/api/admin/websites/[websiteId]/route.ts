import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ websiteId: string }> }
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

    const { websiteId } = await params
    const body = await req.json()
    const { plan } = body

    if (!['FREE', 'STARTER', 'PRO', 'BUSINESS'].includes(plan)) {
      return NextResponse.json({ error: 'Geçersiz plan' }, { status: 400 })
    }

    const updated = await prisma.website.update({
      where: { id: websiteId },
      data: { plan },
      select: { id: true, name: true, domain: true, plan: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Admin update website error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}