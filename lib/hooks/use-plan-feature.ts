'use client'

import { useEffect, useState } from 'react'
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
  const { activeWebsite, isLoading: websiteLoading } = useActiveWebsite()
  const plan = (activeWebsite?.plan || 'FREE') as PlanType
  const [addonAllowed, setAddonAllowed] = useState<boolean | null>(null)
  const [featuresLoading, setFeaturesLoading] = useState(false)

  useEffect(() => {
    if (!activeWebsite?.websiteId) {
      setAddonAllowed(null)
      return
    }

    let cancelled = false
    setFeaturesLoading(true)

    fetch(`/api/websites/${encodeURIComponent(activeWebsite.websiteId)}/plan-features`, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) return null
        return res.json() as Promise<{ features?: Partial<Record<PlanFeature, boolean>> }>
      })
      .then((data) => {
        if (cancelled) return
        setAddonAllowed(data?.features?.[feature] ?? null)
      })
      .catch(() => {
        if (!cancelled) setAddonAllowed(null)
      })
      .finally(() => {
        if (!cancelled) setFeaturesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeWebsite?.websiteId, feature])

  const planAllowed = planAllowsFeature(plan, feature)
  const allowed = addonAllowed !== null ? addonAllowed : planAllowed
  const requiredPlan = MIN_PLAN_FOR_FEATURE[feature] || 'PRO'

  return {
    allowed,
    plan,
    requiredPlan,
    requiredPlanName: PLAN_NAMES[requiredPlan],
    isLoading: websiteLoading || featuresLoading,
    activeWebsite,
  }
}
