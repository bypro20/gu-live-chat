import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const websites = await prisma.website.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        domain: true,
        websiteId: true,
        plan: true,
        createdAt: true,
        owner: { select: { id: true, email: true, name: true } },
        _count: { select: { conversations: true, members: true } },
      },
    })

    return NextResponse.json(websites)
  } catch (error) {
    console.error('Admin websites error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}