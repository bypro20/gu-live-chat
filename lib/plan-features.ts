import { websiteHasFeature, hasActiveAddonPurchase } from './addon-features'
import type { PlanType } from './constants'
import type { Plan } from '@/app/generated/prisma/client'
import type { PlanFeature } from './plan-gate'

export { websiteHasFeature, hasActiveAddonPurchase, hasActiveAddonForFeature } from './addon-features'

/** PRO/BUSINESS plans include auto-translate; STARTER can unlock via addon. */
export async function websiteHasAutoTranslate(
  websiteDbId: string,
  plan: PlanType | Plan
): Promise<boolean> {
  return websiteHasFeature(websiteDbId, plan, 'autoTranslate')
}

/** PRO/BUSINESS include AI assistant; STARTER via ai-agent-pro addon. */
export async function websiteHasAiAssistant(
  websiteDbId: string,
  plan: PlanType | Plan
): Promise<boolean> {
  return websiteHasFeature(websiteDbId, plan, 'aiAssistant')
}

export async function websiteHasPlanFeature(
  websiteDbId: string,
  plan: PlanType | Plan,
  feature: PlanFeature
): Promise<boolean> {
  return websiteHasFeature(websiteDbId, plan, feature)
}
