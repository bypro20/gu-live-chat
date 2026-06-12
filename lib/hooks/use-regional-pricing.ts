'use client'

import { useEffect, useState } from 'react'
import type { LocaleContext } from '@/lib/locale-server'
import { getRegionalPlanPrice } from '@/lib/regional-pricing'
import { formatPrice } from '@/lib/format-price'
import type { PlanId } from '@/lib/plan-cta'
import type { MarketRegion } from '@/lib/regional-config'

export function useRegionalPricing() {
  const [ctx, setCtx] = useState<LocaleContext | null>(null)

  useEffect(() => {
    fetch('/api/locale')
      .then((r) => (r.ok ? r.json() : null))
      .then(setCtx)
      .catch(() => setCtx(null))
  }, [])

  const region: MarketRegion = ctx?.region ?? 'TR'
  const currency = ctx?.currency ?? 'TRY'
  const intlLocale = ctx?.intlLocale ?? 'tr-TR'

  function planPrice(planId: PlanId, yearly = false) {
    const p = getRegionalPlanPrice(region, planId)
    const amount = yearly ? p.yearlyMonthly : p.monthly
    return { amount, currency: p.currency, formatted: formatPrice(amount, p.currency, intlLocale) }
  }

  return { region, currency, intlLocale, locale: ctx?.locale ?? 'tr', planPrice }
}
