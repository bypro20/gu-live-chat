import { prisma } from '@/lib/db'
import { buildWidgetInstallSnippet } from '@/lib/widget-snippet'

export type WidgetUsageStatus = 'ACTIVE' | 'INSTALLED' | 'INACTIVE' | 'NEVER'

export function computeWidgetUsageStatus(input: {
  lastActiveAt: Date | null
  conversationCount: number
  visitorCount: number
  sessionCount: number
  trialBonusWidgetGranted: boolean
}): WidgetUsageStatus {
  const now = Date.now()
  if (input.lastActiveAt) {
    const days = (now - input.lastActiveAt.getTime()) / 86_400_000
    if (days <= 7) return 'ACTIVE'
    if (days <= 30) return 'INSTALLED'
    return 'INACTIVE'
  }
  if (
    input.trialBonusWidgetGranted ||
    input.sessionCount > 0 ||
    input.visitorCount > 0 ||
    input.conversationCount > 0
  ) {
    return 'INSTALLED'
  }
  return 'NEVER'
}

export function widgetStatusLabel(status: WidgetUsageStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Aktif kullanımda'
    case 'INSTALLED':
      return 'Kurulu / geçmişte kullanıldı'
    case 'INACTIVE':
      return 'Pasif (30+ gün)'
    case 'NEVER':
      return 'Henüz yüklenmedi'
  }
}

export async function getWebsiteIntelMaps() {
  const [sessionGroups, visitorGroups] = await Promise.all([
    prisma.visitorSession.groupBy({
      by: ['websiteId'],
      _max: { lastActiveAt: true },
      _count: { id: true },
    }),
    prisma.visitor.groupBy({
      by: ['websiteId'],
      _count: { id: true },
    }),
  ])

  const sessionBySite = new Map(
    sessionGroups.map((g) => [
      g.websiteId,
      { lastActiveAt: g._max.lastActiveAt, sessionCount: g._count.id },
    ]),
  )
  const visitorsBySite = new Map(visitorGroups.map((g) => [g.websiteId, g._count.id]))

  return { sessionBySite, visitorsBySite }
}

export async function fetchAdminWebsitesRich() {
  const websites = await prisma.website.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      domain: true,
      websiteId: true,
      plan: true,
      subscriptionStatus: true,
      trialStartsAt: true,
      trialEndsAt: true,
      trialUsed: true,
      trialBonusWidgetGranted: true,
      trialBonusChatGranted: true,
      signupUtmSource: true,
      signupUtmMedium: true,
      signupUtmCampaign: true,
      signupReferrer: true,
      signupLandingPage: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, email: true, name: true, lastSeenAt: true } },
      members: {
        select: {
          role: true,
          user: { select: { id: true, email: true, name: true } },
        },
      },
      _count: {
        select: {
          conversations: true,
          members: true,
          visitors: true,
          visitorSessions: true,
        },
      },
    },
  })

  const { sessionBySite } = await getWebsiteIntelMaps()

  return websites.map((w) => {
    const sess = sessionBySite.get(w.id)
    const lastActiveAt = sess?.lastActiveAt ?? null
    const widgetStatus = computeWidgetUsageStatus({
      lastActiveAt,
      conversationCount: w._count.conversations,
      visitorCount: w._count.visitors,
      sessionCount: w._count.visitorSessions,
      trialBonusWidgetGranted: w.trialBonusWidgetGranted,
    })

    return {
      ...w,
      embedSnippet: buildWidgetInstallSnippet(w.websiteId),
      lastActiveAt,
      widgetStatus,
      widgetStatusLabel: widgetStatusLabel(widgetStatus),
      isTrialActive:
        !!w.trialEndsAt && new Date(w.trialEndsAt) > new Date() && w.subscriptionStatus !== 'ACTIVE',
    }
  })
}

export async function fetchPlatformIntelligence() {
  const now = new Date()
  const dayAgo = new Date(now.getTime() - 86_400_000)
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000)
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000)

  const [
    totalUsers,
    totalWebsites,
    totalConversations,
    totalMessages,
    totalVisitors,
    activeUsersMonth,
    newUsersWeek,
    newSitesWeek,
    conversationsToday,
    liveSessions,
    paidSites,
    trialSites,
    websitesRich,
    recentUsers,
    planGroups,
    utmGroups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.website.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.visitor.count(),
    prisma.user.count({ where: { lastSeenAt: { gte: monthAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.website.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.conversation.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.visitorSession.count({
      where: { lastActiveAt: { gte: new Date(now.getTime() - 5 * 60_000) }, endedAt: null },
    }),
    prisma.website.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    prisma.website.count({
      where: {
        trialEndsAt: { gt: now },
        subscriptionStatus: { not: 'ACTIVE' },
      },
    }),
    fetchAdminWebsitesRich(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastSeenAt: true,
        _count: { select: { ownedWebsites: true, memberships: true } },
      },
    }),
    prisma.website.groupBy({ by: ['plan'], _count: { id: true } }),
    prisma.website.groupBy({
      by: ['signupUtmSource'],
      where: { signupUtmSource: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ])

  const widgetActive = websitesRich.filter((w) => w.widgetStatus === 'ACTIVE').length
  const widgetInstalled = websitesRich.filter(
    (w) => w.widgetStatus === 'ACTIVE' || w.widgetStatus === 'INSTALLED',
  ).length
  const widgetNever = websitesRich.filter((w) => w.widgetStatus === 'NEVER').length
  const inactiveSites = websitesRich.filter(
    (w) => w._count.conversations === 0 && w._count.visitorSessions === 0,
  )

  return {
    summary: {
      totalUsers,
      activeUsersMonth,
      newUsersWeek,
      totalWebsites,
      newSitesWeek,
      paidSites,
      trialSites,
      totalConversations,
      conversationsToday,
      totalMessages,
      totalVisitors,
      liveSessions,
      widgetActive,
      widgetInstalled,
      widgetNever,
      inactiveSiteCount: inactiveSites.length,
    },
    planDistribution: planGroups.map((p) => ({ plan: p.plan, count: p._count.id })),
    signupSources: utmGroups.map((u) => ({
      source: u.signupUtmSource || 'direct',
      count: u._count.id,
    })),
    recentUsers,
    inactiveSites: inactiveSites.slice(0, 20).map((w) => ({
      id: w.id,
      name: w.name,
      domain: w.domain,
      ownerEmail: w.owner.email,
      createdAt: w.createdAt,
      websiteId: w.websiteId,
    })),
    topActiveSites: [...websitesRich]
      .sort((a, b) => {
        const ta = a.lastActiveAt?.getTime() ?? 0
        const tb = b.lastActiveAt?.getTime() ?? 0
        return tb - ta
      })
      .slice(0, 15)
      .map((w) => ({
        id: w.id,
        name: w.name,
        domain: w.domain,
        websiteId: w.websiteId,
        ownerEmail: w.owner.email,
        plan: w.plan,
        widgetStatus: w.widgetStatus,
        lastActiveAt: w.lastActiveAt,
        conversations: w._count.conversations,
        visitors: w._count.visitors,
      })),
  }
}
