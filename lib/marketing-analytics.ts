import { prisma } from './db'

export type SignupSourceRow = {
  source: string
  medium: string | null
  campaign: string | null
  count: number
}

export async function getSignupSourceStats(limit = 12): Promise<SignupSourceRow[]> {
  const rows = await prisma.website.findMany({
    where: { signupUtmSource: { not: null } },
    select: {
      signupUtmSource: true,
      signupUtmMedium: true,
      signupUtmCampaign: true,
    },
  })

  const map = new Map<string, SignupSourceRow>()
  for (const row of rows) {
    const source = row.signupUtmSource ?? 'unknown'
    const key = `${source}|${row.signupUtmMedium ?? ''}|${row.signupUtmCampaign ?? ''}`
    const existing = map.get(key)
    if (existing) {
      existing.count += 1
    } else {
      map.set(key, {
        source,
        medium: row.signupUtmMedium,
        campaign: row.signupUtmCampaign,
        count: 1,
      })
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit)
}

export async function getReferralSignupCount(): Promise<number> {
  return prisma.website.count({ where: { referralCode: { not: null } } })
}

export async function getRecentAttributedSignups(take = 8) {
  return prisma.website.findMany({
    where: {
      OR: [
        { signupUtmSource: { not: null } },
        { referralCode: { not: null } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      name: true,
      domain: true,
      plan: true,
      createdAt: true,
      signupUtmSource: true,
      signupUtmMedium: true,
      signupUtmCampaign: true,
      referralCode: true,
      signupLandingPage: true,
      owner: { select: { email: true } },
    },
  })
}
