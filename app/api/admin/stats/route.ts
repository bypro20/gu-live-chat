import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { getTrialFunnelStats, getRecentTrialWebsites } from '@/lib/trial-analytics'

export async function GET() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const [
      totalUsers, totalWebsites, totalConversations, totalMessages,
      paidWebsites, trialWebsites, addonPurchases,
      invoices, bannedUsers, totalIpBans,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.website.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.website.count({ where: { plan: { not: 'FREE' } } }),
      prisma.website.count({ where: { trialUsed: true } }),
      prisma.addonPurchase.count({ where: { isActive: true } }),
      prisma.invoice.findMany({ where: { status: 'PAID' }, select: { amount: true } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.ipBan.count(),
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

    const [trialFunnel, recentTrials] = await Promise.all([
      getTrialFunnelStats(),
      getRecentTrialWebsites(8),
    ])

    return NextResponse.json({
      totalUsers,
      totalWebsites,
      totalConversations,
      totalMessages,
      activeVisitors: 0,
      totalRevenue: Math.round(totalRevenue / 100),
      paidWebsites,
      trialWebsites,
      bannedUsers,
      totalIpBans,
      planDistribution: planDistribution.map(p => ({ plan: p.plan, count: p._count.id })),
      recentUsers: recentUsers.map(u => ({
        ...u,
        _count: { websites: u._count.ownedWebsites },
      })),
      recentWebsites,
      addonPurchases,
      addonRevenue: addonPurchases * 0,
      trialFunnel,
      recentTrials: recentTrials.map((w) => ({
        ...w,
        trialStartsAt: w.trialStartsAt?.toISOString() ?? null,
        trialEndsAt: w.trialEndsAt?.toISOString() ?? null,
      })),
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
