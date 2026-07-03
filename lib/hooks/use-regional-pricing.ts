'use client'

import { useCallback } from 'react'
import { useLocale } from '@/components/marketing/locale-provider'
import { getPlanPriceForCurrency } from '@/lib/regional-pricing'
import { formatPrice } from '@/lib/format-price'
import type { PlanId } from '@/lib/plan-cta'

/** Ülkeye göre para birimi — LocaleProvider sunucudan IP ile doldurur */
export function useRegionalPricing() {
  const { region, currency, intlLocale, locale, country } = useLocale()

  const planPrice = useCallback(
    (planId: PlanId, yearly = false) => {
      const p = getPlanPriceForCurrency(currency, planId)
      const amount = yearly ? p.yearlyMonthly : p.monthly
      return { amount, currency: p.currency, formatted: formatPrice(amount, p.currency, intlLocale) }
    },
    [currency, intlLocale],
  )

  return { region, currency, intlLocale, locale, country, planPrice }
}
