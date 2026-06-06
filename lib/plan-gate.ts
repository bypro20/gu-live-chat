import { NextResponse } from 'next/server'
import type { Plan } from '@/app/generated/prisma/client'
import { canPerformAction } from '@/lib/subscription'
import type { PLAN_LIMITS } from '@/lib/constants'
import { websiteHasFeature, FEATURE_ADDON_SLUG } from '@/lib/addon-features'

export type PlanFeature = keyof (typeof PLAN_LIMITS)[Plan]

const FEATURE_LABELS: Partial<Record<PlanFeature, string>> = {
  chatbot: 'Chatbot',
  knowledgeBase: 'Bilgi bankası',
  ticketing: 'Bilet sistemi',
  webhooks: 'Webhook',
  workflows: 'Otomasyon',
  campaigns: 'Kampanya',
  cannedResponses: 'Hazır cevaplar',
  statusPage: 'Durum sayfası',
  apiAccess: 'API erişimi',
  visitorTracking: 'Ziyaretçi takibi',
  aiAssistant: 'AI asistan',
  overlayAI: 'Ekran izleme',
  multiChannel: 'Çoklu kanal',
  autoTranslate: 'Otomatik çeviri',
  fileUpload: 'Dosya yükleme',
  customBranding: 'Özel marka',
  ratings: 'CSAT puanlama',
  proactiveMessages: 'Hedefli mesajlar',
  advancedAnalytics: 'Gelişmiş analitik',
}

/** Minimum paid plan that unlocks each feature (for upgrade UI). */
export const MIN_PLAN_FOR_FEATURE: Partial<Record<PlanFeature, Plan>> = {
  chatbot: 'STARTER',
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

export function planHasFeature(plan: Plan, feature: PlanFeature): boolean {
  return canPerformAction(plan, feature)
}

export function planFeatureDenied(
  plan: Plan,
  feature: PlanFeature,
  currentCount?: number
): NextResponse | null {
  if (canPerformAction(plan, feature, currentCount)) return null
  const label = FEATURE_LABELS[feature] || feature
  const requiredPlan = MIN_PLAN_FOR_FEATURE[feature] || 'PRO'
  const addonSlug = FEATURE_ADDON_SLUG[feature]
  return NextResponse.json(
    {
      error: `${label} özelliği mevcut planınızda kullanılamaz. Planınızı yükseltin veya eklenti satın alın.`,
      upgradeRequired: true,
      feature,
      requiredPlan,
      addonSlug: addonSlug || null,
    },
    { status: 403 }
  )
}

/** Plan + active addon purchase check for API routes. */
export async function planFeatureDeniedAsync(
  websiteDbId: string,
  plan: Plan,
  feature: PlanFeature,
  currentCount?: number
): Promise<NextResponse | null> {
  if (await websiteHasFeature(websiteDbId, plan, feature, currentCount)) return null
  const label = FEATURE_LABELS[feature] || feature
  const requiredPlan = MIN_PLAN_FOR_FEATURE[feature] || 'PRO'
  const addonSlug = FEATURE_ADDON_SLUG[feature]
  return NextResponse.json(
    {
      error: `${label} özelliği mevcut planınızda kullanılamaz. Planınızı yükseltin veya eklenti satın alın.`,
      upgradeRequired: true,
      feature,
      requiredPlan,
      addonSlug: addonSlug || null,
    },
    { status: 403 }
  )
}
