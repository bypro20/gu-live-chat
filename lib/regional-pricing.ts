import type { PlanId } from './plan-cta'
import type { MarketRegion, PaymentCurrency } from './regional-config'

export type RegionalPlanPrice = {
  monthly: number
  yearlyMonthly: number
  currency: PaymentCurrency
}

/** Aylık fiyatlar — bölgeye göre yerel para birimi */
export const REGIONAL_PLAN_PRICES: Record<MarketRegion, Record<PlanId, RegionalPlanPrice>> = {
  TR: {
    FREE: { monthly: 0, yearlyMonthly: 0, currency: 'TRY' },
    STARTER: { monthly: 790, yearlyMonthly: 632, currency: 'TRY' },
    PRO: { monthly: 1990, yearlyMonthly: 1592, currency: 'TRY' },
    BUSINESS: { monthly: 4990, yearlyMonthly: 3992, currency: 'TRY' },
  },
  EU: {
    FREE: { monthly: 0, yearlyMonthly: 0, currency: 'EUR' },
    STARTER: { monthly: 29, yearlyMonthly: 23, currency: 'EUR' },
    PRO: { monthly: 59, yearlyMonthly: 47, currency: 'EUR' },
    BUSINESS: { monthly: 149, yearlyMonthly: 119, currency: 'EUR' },
  },
  GLOBAL: {
    FREE: { monthly: 0, yearlyMonthly: 0, currency: 'USD' },
    STARTER: { monthly: 39, yearlyMonthly: 31, currency: 'USD' },
    PRO: { monthly: 79, yearlyMonthly: 63, currency: 'USD' },
    BUSINESS: { monthly: 199, yearlyMonthly: 159, currency: 'USD' },
  },
}

export function getRegionalPlanPrice(region: MarketRegion, planId: PlanId): RegionalPlanPrice {
  return REGIONAL_PLAN_PRICES[region][planId]
}

/** Ödeme doğrulama — en küçük para birimi (kuruş/cent) */
export function toMinorUnits(amount: number, currency: PaymentCurrency): number {
  return Math.round(amount * 100)
}

export function getExpectedMinorUnits(region: MarketRegion, planId: PlanId): number {
  const p = getRegionalPlanPrice(region, planId)
  return toMinorUnits(p.monthly, p.currency)
}

/** Geriye dönük uyumluluk — TR fiyatları constants.ts PLANS ile aynı */
export function trPlanPriceTry(planId: PlanId): number {
  return REGIONAL_PLAN_PRICES.TR[planId].monthly
}
