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

    const [totalUsers, totalWebsites, totalConversations, totalMessages] = await Promise.all([
      prisma.user.count(),
      prisma.website.count(),
      prisma.conversation.count(),
      prisma.message.count(),
    ])

    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })

    const recentWebsites = await prisma.website.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, domain: true, plan: true, createdAt: true },
    })

    return NextResponse.json({
      totalUsers,
      totalWebsites,
      totalConversations,
      totalMessages,
      recentUsers,
      recentWebsites,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}