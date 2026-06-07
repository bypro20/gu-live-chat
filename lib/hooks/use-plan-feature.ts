'use client'

import type { PlanType } from '@/lib/constants'
import type { PlanFeature } from '@/lib/plan-shared'
import { MIN_PLAN_FOR_FEATURE, planAllowsFeature } from '@/lib/plan-shared'
import { useActiveWebsite } from './use-active-website'

const PLAN_NAMES: Record<PlanType, string> = {
  FREE: 'Ücretsiz',
  STARTER: 'Başlangıç',
  PRO: 'Profesyonel',
  BUSINESS: 'Kurumsal',
}

export function usePlanFeature(feature: PlanFeature) {
  const { activeWebsite, isLoading } = useActiveWebsite()
  const plan = (activeWebsite?.plan || 'FREE') as PlanType
  const allowed = planAllowsFeature(plan, feature)
  const requiredPlan = MIN_PLAN_FOR_FEATURE[feature] || 'PRO'

  return {
    allowed,
    plan,
    requiredPlan,
    requiredPlanName: PLAN_NAMES[requiredPlan],
    isLoading,
    activeWebsite,
  }
}
