import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ]
    }

    if (role && (role === 'ADMIN' || role === 'USER')) {
      where.role = role
    }

    if (status === 'banned') {
      where.isBanned = true
    } else if (status === 'muted') {
      where.isMuted = true
    } else if (status === 'active') {
      where.isBanned = false
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBanned: true,
        isMuted: true,
        bannedIp: true,
        banReason: true,
        bannedAt: true,
        mutedUntil: true,
        lastSeenAt: true,
        createdAt: true,
        _count: {
          select: {
            ownedWebsites: true,
            assignedConversations: true,
          },
        },
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
