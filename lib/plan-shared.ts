import { PLAN_LIMITS, type PlanType } from './constants'

/** Client-safe plan feature keys (no DB / server imports). */
export type PlanFeature = keyof (typeof PLAN_LIMITS)[PlanType]

/** Minimum paid plan that unlocks each feature (for upgrade UI). */
export const MIN_PLAN_FOR_FEATURE: Partial<Record<PlanFeature, PlanType>> = {
  chatbot: 'PRO',
  visitorTracking: 'STARTER',
  cannedResponses: 'STARTER',
  knowledgeBase: 'STARTER',
  ticketing: 'STARTER',
  fileUpload: 'STARTER',
  ratings: 'STARTER',
  proactiveMessages: 'STARTER',
  overlayAI: 'PRO',
  aiAssistant: 'PRO',
  campaigns: 'PRO',
  multiChannel: 'PRO',
  workflows: 'PRO',
  statusPage: 'PRO',
  webhooks: 'PRO',
  apiAccess: 'PRO',
  autoTranslate: 'PRO',
  advancedAnalytics: 'PRO',
  customBranding: 'BUSINESS',
}

/** Primary addon slug shown in upgrade UI per feature. */
export const FEATURE_ADDON_SLUG: Partial<Record<PlanFeature, string>> = {
  multiChannel: 'whatsapp-channel',
  aiAssistant: 'ai-sohbet-asistani',
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

export function planAllowsFeature(plan: PlanType, feature: PlanFeature): boolean {
  const limit = PLAN_LIMITS[plan][feature]
  return limit === true || limit === Infinity
}
