'use client'

import { useEffect, useState } from 'react'
import type { LocaleContext } from '@/lib/locale-server'
import { getPlanPriceForCurrency } from '@/lib/regional-pricing'
import { formatPrice } from '@/lib/format-price'
import type { PlanId } from '@/lib/plan-cta'
import type { MarketRegion, PaymentCurrency } from '@/lib/regional-config'
import { GLOBAL_FALLBACK_COUNTRY, resolvePaymentCurrency } from '@/lib/regional-config'

export function useRegionalPricing() {
  const [ctx, setCtx] = useState<LocaleContext | null>(null)

  useEffect(() => {
    fetch('/api/locale')
      .then((r) => (r.ok ? r.json() : null))
      .then(setCtx)
      .catch(() => setCtx(null))
  }, [])

  const region: MarketRegion = ctx?.region ?? 'GLOBAL'
  const currency: PaymentCurrency =
    ctx?.currency ?? resolvePaymentCurrency(GLOBAL_FALLBACK_COUNTRY)
  const intlLocale = ctx?.intlLocale ?? 'en-US'

  function planPrice(planId: PlanId, yearly = false) {
    const p = getPlanPriceForCurrency(currency, planId)
    const amount = yearly ? p.yearlyMonthly : p.monthly
    return { amount, currency: p.currency, formatted: formatPrice(amount, p.currency, intlLocale) }
  }

  return { region, currency, intlLocale, locale: ctx?.locale ?? 'en', planPrice }
}
