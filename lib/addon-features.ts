import { prisma } from './db'
import { canPerformAction } from './subscription'
import { PLAN_LIMITS, type PlanType } from './constants'
import type { PlanFeature } from './plan-gate'
import type { Plan } from '@/app/generated/prisma/client'

/** Addon slug → plan feature it unlocks when purchased. */
export const ADDON_FEATURE_MAP: Record<string, PlanFeature> = {
  'whatsapp-channel': 'multiChannel',
  'telegram-channel': 'multiChannel',
  'messenger-channel': 'multiChannel',
  'instagram-channel': 'multiChannel',
  'email-channel': 'multiChannel',
  'ai-agent-pro': 'aiAssistant',
  'ai-copilot': 'aiAssistant',
  'live-translate-pro': 'autoTranslate',
  'ai-chatbot': 'chatbot',
  'knowledge-base': 'knowledgeBase',
  'ticketing-system': 'ticketing',
  'csat-ratings': 'ratings',
  'canned-responses': 'cannedResponses',
  'proactive-chat': 'proactiveMessages',
  'visitor-tracking': 'visitorTracking',
  'email-campaigns': 'campaigns',
  'workflow-automation': 'workflows',
  'webhooks-api': 'webhooks',
  'rest-api': 'apiAccess',
  'status-page': 'statusPage',
  'screen-co-browsing': 'overlayAI',
  'advanced-analytics': 'advancedAnalytics',
  'white-label': 'customBranding',
  'crm-advanced': 'visitorTracking',
  'ecommerce-tracker': 'visitorTracking',
  'sentiment-analysis': 'aiAssistant',
  'team-departments': 'workflows',
}

/** Primary addon slug shown in upgrade UI per feature. */
export const FEATURE_ADDON_SLUG: Partial<Record<PlanFeature, string>> = {
  multiChannel: 'whatsapp-channel',
  aiAssistant: 'ai-agent-pro',
  autoTranslate: 'live-translate-pro',
  chatbot: 'ai-chatbot',
  knowledgeBase: 'knowledge-base',
  ticketing: 'ticketing-system',
  ratings: 'csat-ratings',
  cannedResponses: 'canned-responses',
  proactiveMessages: 'proactive-chat',
  visitorTracking: 'visitor-tracking',
  campaigns: 'email-campaigns',
  workflows: 'workflow-automation',
  webhooks: 'webhooks-api',
  apiAccess: 'rest-api',
  statusPage: 'status-page',
  overlayAI: 'screen-co-browsing',
  advancedAnalytics: 'advanced-analytics',
  customBranding: 'white-label',
}

const CHANNEL_ADDON_SLUGS = new Set([
  'whatsapp-channel',
  'telegram-channel',
  'messenger-channel',
  'instagram-channel',
  'email-channel',
])

export function addonUnlocksFeature(slug: string, feature: PlanFeature): boolean {
  if (ADDON_FEATURE_MAP[slug] === feature) return true
  if (feature === 'multiChannel' && CHANNEL_ADDON_SLUGS.has(slug)) return true
  return false
}

export async function hasActiveAddonPurchase(
  websiteDbId: string,
  slug: string
): Promise<boolean> {
  const purchase = await prisma.addonPurchase.findFirst({
    where: {
      websiteId: websiteDbId,
      isActive: true,
      addon: { slug, isActive: true },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  })
  return !!purchase
}

export async function hasActiveAddonForFeature(
  websiteDbId: string,
  feature: PlanFeature
): Promise<boolean> {
  const slugs = Object.entries(ADDON_FEATURE_MAP)
    .filter(([, f]) => f === feature)
    .map(([slug]) => slug)

  if (feature === 'multiChannel') {
    slugs.push(...CHANNEL_ADDON_SLUGS)
  }

  const uniqueSlugs = [...new Set(slugs)]
  if (uniqueSlugs.length === 0) return false

  const purchase = await prisma.addonPurchase.findFirst({
    where: {
      websiteId: websiteDbId,
      isActive: true,
      addon: { slug: { in: uniqueSlugs }, isActive: true },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  })
  return !!purchase
}

export async function websiteHasFeature(
  websiteDbId: string,
  plan: Plan | PlanType,
  feature: PlanFeature,
  currentCount?: number
): Promise<boolean> {
  if (canPerformAction(plan as Plan, feature, currentCount)) return true
  return hasActiveAddonForFeature(websiteDbId, feature)
}
