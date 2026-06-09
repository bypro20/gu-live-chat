import { prisma } from './db'
import { Plan } from '../app/generated/prisma/client'
import {
  TRIAL_DAYS,
  TRIAL_BONUS_WIDGET_DAYS,
  TRIAL_BONUS_FIRST_CHAT_DAYS,
  TRIAL_MAX_DAYS,
} from './trial-config'

const TRIAL_PLAN: Plan = 'PRO'
const DAY_MS = 24 * 60 * 60 * 1000

function capTrialEnd(trialStartsAt: Date, proposedEnd: Date): Date {
  const maxEnd = new Date(trialStartsAt.getTime() + TRIAL_MAX_DAYS * DAY_MS)
  return proposedEnd > maxEnd ? maxEnd : proposedEnd
}

// ─── Start Trial ───────────────────────────────────────────────────

export async function startTrial(websiteId: string): Promise<{
  trialEndsAt: Date
  trialPlan: Plan
}> {
  const now = new Date()
  const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * DAY_MS)

  await prisma.website.update({
    where: { websiteId },
    data: {
      plan: TRIAL_PLAN,
      subscriptionStatus: 'TRIALING',
      trialStartsAt: now,
      trialEndsAt,
      trialUsed: true,
      trialBonusWidgetGranted: false,
      trialBonusChatGranted: false,
    },
  })

  return { trialEndsAt, trialPlan: TRIAL_PLAN }
}

// ─── Activation bonuses (widget install / first chat) ──────────────

export async function extendTrialForActivation(
  websiteId: string,
  reason: 'widget' | 'first_chat'
): Promise<boolean> {
  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: {
      subscriptionStatus: true,
      trialStartsAt: true,
      trialEndsAt: true,
      trialBonusWidgetGranted: true,
      trialBonusChatGranted: true,
    },
  })

  if (!website?.trialStartsAt || !website.trialEndsAt) return false
  if (website.subscriptionStatus !== 'TRIALING') return false
  if (new Date() >= website.trialEndsAt) return false

  const bonusDays =
    reason === 'widget' ? TRIAL_BONUS_WIDGET_DAYS : TRIAL_BONUS_FIRST_CHAT_DAYS
  const alreadyGranted =
    reason === 'widget'
      ? website.trialBonusWidgetGranted
      : website.trialBonusChatGranted

  if (alreadyGranted) return false

  const baseEnd = website.trialEndsAt.getTime()
  const proposedEnd = new Date(baseEnd + bonusDays * DAY_MS)
  const trialEndsAt = capTrialEnd(website.trialStartsAt, proposedEnd)

  if (trialEndsAt.getTime() === baseEnd) return false

  await prisma.website.update({
    where: { websiteId },
    data: {
      trialEndsAt,
      ...(reason === 'widget'
        ? { trialBonusWidgetGranted: true }
        : { trialBonusChatGranted: true }),
    },
  })

  return true
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
  bonusWidgetGranted: boolean
  bonusChatGranted: boolean
}> {
  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: {
      subscriptionStatus: true,
      trialStartsAt: true,
      trialEndsAt: true,
      trialUsed: true,
      trialBonusWidgetGranted: true,
      trialBonusChatGranted: true,
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
      bonusWidgetGranted: false,
      bonusChatGranted: false,
    }
  }

  const isTrialing =
    website.subscriptionStatus === 'TRIALING' &&
    website.trialEndsAt !== null &&
    new Date() < website.trialEndsAt

  let daysLeft = 0
  if (isTrialing && website.trialEndsAt) {
    const diff = website.trialEndsAt.getTime() - new Date().getTime()
    daysLeft = Math.ceil(diff / DAY_MS)
  }

  return {
    isTrialing,
    daysLeft,
    trialEndsAt: website.trialEndsAt,
    trialPlan: isTrialing ? website.plan : null,
    trialUsed: website.trialUsed,
    bonusWidgetGranted: website.trialBonusWidgetGranted,
    bonusChatGranted: website.trialBonusChatGranted,
  }
}

// ─── Expire Trial (called by cron or middleware) ───────────────────

export async function expireTrial(websiteId: string): Promise<void> {
  await prisma.website.update({
    where: { websiteId },
    data: {
      plan: 'FREE',
      subscriptionStatus: 'CANCELED',
      trialEndsAt: new Date(),
    },
  })
}

// ─── Check and Expire Trials ──────────────────────────────────────

export async function checkAndExpireTrials(): Promise<number> {
  const now = new Date()

  const expiredTrials = await prisma.website.findMany({
    where: {
      subscriptionStatus: 'TRIALING',
      trialEndsAt: { lt: now },
    },
    select: { id: true, websiteId: true },
  })

  await Promise.all(expiredTrials.map((w) => expireTrial(w.websiteId)))

  return expiredTrials.length
}
