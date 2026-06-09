import { NextResponse } from 'next/server'
import type { Plan } from '@/app/generated/prisma/client'
import { auth } from '@/lib/auth'
import { canPerformAction } from '@/lib/subscription'
import { websiteHasFeature } from '@/lib/addon-features'
import { isPlatformAdminRole } from '@/lib/admin-website'
import {
  FEATURE_ADDON_SLUG,
  MIN_PLAN_FOR_FEATURE,
  type PlanFeature,
} from '@/lib/plan-shared'

export type { PlanFeature } from '@/lib/plan-shared'
export { MIN_PLAN_FOR_FEATURE } from '@/lib/plan-shared'

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
  aiAssistant: 'AI Sohbet Asistanı',
  overlayAI: 'Ekran izleme',
  multiChannel: 'Çoklu kanal',
  autoTranslate: 'Otomatik çeviri',
  fileUpload: 'Dosya yükleme',
  customBranding: 'Özel marka',
  ratings: 'CSAT puanlama',
  proactiveMessages: 'Hedefli mesajlar',
  advancedAnalytics: 'Gelişmiş analitik',
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
  const session = await auth()
  if (isPlatformAdminRole(session?.user?.role)) return null
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
