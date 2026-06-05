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

    const [
      totalUsers, totalWebsites, totalConversations, totalMessages,
      paidWebsites, trialWebsites, addonPurchases,
      invoices, addonInvoices,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.website.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.website.count({ where: { plan: { not: 'FREE' } } }),
      prisma.website.count({ where: { trialUsed: true } }),
      prisma.addonPurchase.count({ where: { isActive: true } }),
      prisma.invoice.findMany({ where: { status: 'PAID' }, select: { amount: true } }),
      prisma.addonPurchase.count({ where: { isActive: true } }),
    ])

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0)

    const planDistribution = await prisma.website.groupBy({
      by: ['plan'],
      _count: { id: true },
    })

    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, name: true, role: true, createdAt: true,
        _count: { select: { ownedWebsites: true } },
      },
    })

    const recentWebsites = await prisma.website.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, domain: true, plan: true, createdAt: true,
        owner: { select: { email: true } },
      },
    })

    return NextResponse.json({
      totalUsers,
      totalWebsites,
      totalConversations,
      totalMessages,
      activeVisitors: 0,
      totalRevenue: Math.round(totalRevenue / 100),
      paidWebsites,
      trialWebsites,
      planDistribution: planDistribution.map(p => ({ plan: p.plan, count: p._count.id })),
      recentUsers,
      recentWebsites,
      addonPurchases,
      addonRevenue: addonPurchases * 0,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
