import { prisma } from './db'
import { canPerformAction } from './subscription'
import { PLAN_LIMITS, PlanType } from './constants'
import { Plan } from '../app/generated/prisma/client'

// ─── Plan Feature Checks ────────────────────────────────────────────

export type PlanFeature = keyof (typeof PLAN_LIMITS)[PlanType]

/**
 * Check if a website can create a new conversation this month
 */
export async function canCreateConversation(websiteId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: { id: true, plan: true },
  })

  if (!website) {
    return { allowed: false, current: 0, limit: 0 }
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const currentCount = await prisma.conversation.count({
    where: {
      websiteId: website.id,
      createdAt: { gte: startOfMonth },
    },
  })

  const limit = PLAN_LIMITS[website.plan].maxConversationsPerMonth
  const allowed = canPerformAction(website.plan, 'maxConversationsPerMonth', currentCount)

  return { allowed, current: currentCount, limit: limit === Infinity ? -1 : limit }
}

/**
 * Check if a website can add another team member
 */
export async function canAddTeamMember(websiteId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: { id: true, plan: true },
  })

  if (!website) {
    return { allowed: false, current: 0, limit: 0 }
  }

  const currentCount = await prisma.teamMember.count({
    where: { websiteId: website.id },
  })

  const limit = PLAN_LIMITS[website.plan].maxAgents
  const allowed = canPerformAction(website.plan, 'maxAgents', currentCount)

  return { allowed, current: currentCount, limit: limit === Infinity ? -1 : limit }
}

/**
 * Check if a website has access to a specific plan feature (boolean feature gates)
 */
export async function canUseFeature(websiteId: string, feature: PlanFeature): Promise<{ allowed: boolean; plan: Plan }> {
  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: { plan: true },
  })

  if (!website) {
    return { allowed: false, plan: 'FREE' as Plan }
  }

  const allowed = canPerformAction(website.plan, feature)

  return { allowed, plan: website.plan }
}

/**
 * Get all plan limits for a website (for client-side display)
 */
export async function getWebsitePlanInfo(websiteId: string) {
  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: { id: true, plan: true },
  })

  if (!website) return null

  const planLimits = PLAN_LIMITS[website.plan]
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [conversationCount, teamMemberCount] = await Promise.all([
    prisma.conversation.count({
      where: {
        websiteId: website.id,
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.teamMember.count({
      where: { websiteId: website.id },
    }),
  ])

  return {
    plan: website.plan,
    limits: planLimits,
    usage: {
      conversations: {
        current: conversationCount,
        limit: planLimits.maxConversationsPerMonth === Infinity ? -1 : planLimits.maxConversationsPerMonth,
      },
      teamMembers: {
        current: teamMemberCount,
        limit: planLimits.maxAgents === Infinity ? -1 : planLimits.maxAgents,
      },
    },
  }
}