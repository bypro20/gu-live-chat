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
    STARTER: { monthly: 1790, yearlyMonthly: 1432, currency: 'TRY' },
    PRO: { monthly: 3790, yearlyMonthly: 3032, currency: 'TRY' },
    BUSINESS: { monthly: 11990, yearlyMonthly: 9592, currency: 'TRY' },
  },
  EU: {
    FREE: { monthly: 0, yearlyMonthly: 0, currency: 'EUR' },
    STARTER: { monthly: 49, yearlyMonthly: 39, currency: 'EUR' },
    PRO: { monthly: 99, yearlyMonthly: 79, currency: 'EUR' },
    BUSINESS: { monthly: 299, yearlyMonthly: 239, currency: 'EUR' },
  },
  GLOBAL: {
    FREE: { monthly: 0, yearlyMonthly: 0, currency: 'USD' },
    STARTER: { monthly: 59, yearlyMonthly: 47, currency: 'USD' },
    PRO: { monthly: 119, yearlyMonthly: 95, currency: 'USD' },
    BUSINESS: { monthly: 349, yearlyMonthly: 279, currency: 'USD' },
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
