import { prisma } from './db'

export interface TrialFunnelStats {
  totalStarted: number
  activeTrials: number
  convertedToPaid: number
  churnedAfterTrial: number
  expiringWithin48h: number
  startedLast7Days: number
  convertedLast30Days: number
  widgetBonusGranted: number
  chatBonusGranted: number
  bothBonusesGranted: number
  conversionRate: number
  widgetBonusRate: number
  chatBonusRate: number
  activationRate: number
}

export async function getTrialFunnelStats(): Promise<TrialFunnelStats> {
  const now = new Date()
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalStarted,
    activeTrials,
    convertedToPaid,
    churnedAfterTrial,
    expiringWithin48h,
    startedLast7Days,
    convertedLast30Days,
    widgetBonusGranted,
    chatBonusGranted,
    bothBonusesGranted,
    activatedTrials,
  ] = await Promise.all([
    prisma.website.count({ where: { trialUsed: true } }),
    prisma.website.count({
      where: {
        subscriptionStatus: 'TRIALING',
        trialEndsAt: { gt: now },
      },
    }),
    prisma.website.count({
      where: {
        trialUsed: true,
        subscriptionStatus: 'ACTIVE',
        plan: { not: 'FREE' },
      },
    }),
    prisma.website.count({
      where: {
        trialUsed: true,
        plan: 'FREE',
        NOT: {
          subscriptionStatus: 'TRIALING',
        },
      },
    }),
    prisma.website.count({
      where: {
        subscriptionStatus: 'TRIALING',
        trialEndsAt: { gt: now, lte: in48h },
      },
    }),
    prisma.website.count({
      where: {
        trialUsed: true,
        trialStartsAt: { gte: last7Days },
      },
    }),
    prisma.website.count({
      where: {
        trialUsed: true,
        subscriptionStatus: 'ACTIVE',
        plan: { not: 'FREE' },
        updatedAt: { gte: last30Days },
      },
    }),
    prisma.website.count({
      where: { trialUsed: true, trialBonusWidgetGranted: true },
    }),
    prisma.website.count({
      where: { trialUsed: true, trialBonusChatGranted: true },
    }),
    prisma.website.count({
      where: {
        trialUsed: true,
        trialBonusWidgetGranted: true,
        trialBonusChatGranted: true,
      },
    }),
    prisma.website.count({
      where: {
        trialUsed: true,
        OR: [
          { trialBonusWidgetGranted: true },
          { trialBonusChatGranted: true },
        ],
      },
    }),
  ])

  const pct = (part: number, whole: number) =>
    whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0

  return {
    totalStarted,
    activeTrials,
    convertedToPaid,
    churnedAfterTrial,
    expiringWithin48h,
    startedLast7Days,
    convertedLast30Days,
    widgetBonusGranted,
    chatBonusGranted,
    bothBonusesGranted,
    conversionRate: pct(convertedToPaid, totalStarted),
    widgetBonusRate: pct(widgetBonusGranted, totalStarted),
    chatBonusRate: pct(chatBonusGranted, totalStarted),
    activationRate: pct(activatedTrials, totalStarted),
  }
}

export async function getRecentTrialWebsites(limit = 8) {
  return prisma.website.findMany({
    where: { trialUsed: true },
    take: limit,
    orderBy: { trialStartsAt: 'desc' },
    select: {
      id: true,
      name: true,
      domain: true,
      plan: true,
      subscriptionStatus: true,
      trialStartsAt: true,
      trialEndsAt: true,
      trialBonusWidgetGranted: true,
      trialBonusChatGranted: true,
      owner: { select: { email: true } },
    },
  })
}
