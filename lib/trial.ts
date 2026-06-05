import { prisma } from './db'
import { Plan, SubscriptionStatus } from '../app/generated/prisma/client'

// ─── Constants ─────────────────────────────────────────────────────

const TRIAL_DAYS = 14
const TRIAL_PLAN: Plan = 'PRO'

// ─── Start Trial ───────────────────────────────────────────────────

export async function startTrial(websiteId: string): Promise<{
  trialEndsAt: Date
  trialPlan: Plan
}> {
  const now = new Date()
  const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)

  await prisma.website.update({
    where: { websiteId },
    data: {
      plan: TRIAL_PLAN,
      subscriptionStatus: 'TRIALING',
      trialStartsAt: now,
      trialEndsAt,
      trialUsed: true,
    },
  })

  return { trialEndsAt, trialPlan: TRIAL_PLAN }
}

// ─── Check if Trial is Active ──────────────────────────────────────

export async function isTrialActive(websiteId: string): Promise<boolean> {
  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: { subscriptionStatus: true, trialEndsAt: true },
  })

  if (!website) return false

  if (website.subscriptionStatus !== 'TRIALING') return false
  if (!website.trialEndsAt) return false

  return new Date() < website.trialEndsAt
}

// ─── Get Trial Info ────────────────────────────────────────────────

export async function getTrialInfo(websiteId: string): Promise<{
  isTrialing: boolean
  daysLeft: number
  trialEndsAt: Date | null
  trialPlan: Plan | null
  trialUsed: boolean
}> {
  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: {
      subscriptionStatus: true,
      trialStartsAt: true,
      trialEndsAt: true,
      trialUsed: true,
      plan: true,
    },
  })

  if (!website) {
    return {
      isTrialing: false,
      daysLeft: 0,
      trialEndsAt: null,
      trialPlan: null,
      trialUsed: false,
    }
  }

  const isTrialing = website.subscriptionStatus === 'TRIALING' &&
    website.trialEndsAt !== null &&
    new Date() < website.trialEndsAt

  let daysLeft = 0
  if (isTrialing && website.trialEndsAt) {
    const diff = website.trialEndsAt.getTime() - new Date().getTime()
    daysLeft = Math.ceil(diff / (24 * 60 * 60 * 1000))
  }

  return {
    isTrialing,
    daysLeft,
    trialEndsAt: website.trialEndsAt,
    trialPlan: isTrialing ? website.plan : null,
    trialUsed: website.trialUsed,
  }
}

// ─── Expire Trial (called by cron or middleware) ───────────────────

export async function expireTrial(websiteId: string): Promise<void> {
  await prisma.website.update({
    where: { websiteId },
    data: {
      plan: 'FREE',
      subscriptionStatus: 'CANCELED',
      trialEndsAt: new Date(), // Mark as expired
    },
  })
}

// ─── Check and Expire Trials ──────────────────────────────────────
// Call this periodically to clean up expired trials

export async function checkAndExpireTrials(): Promise<number> {
  const now = new Date()

  const expiredTrials = await prisma.website.findMany({
    where: {
      subscriptionStatus: 'TRIALING',
      trialEndsAt: { lt: now },
    },
    select: { id: true, websiteId: true },
  })

  await Promise.all(
    expiredTrials.map((w) => expireTrial(w.websiteId))
  )

  return expiredTrials.length
}