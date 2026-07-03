import type { PlanId } from './plan-cta'
import type { MarketRegion, PaymentCurrency } from './regional-config'
import { resolvePaymentCurrency } from './regional-config'

export type RegionalPlanPrice = {
  monthly: number
  yearlyMonthly: number
  currency: PaymentCurrency
}

/** iyzico para birimine göre paket fiyatları */
export const CURRENCY_PLAN_PRICES: Record<PaymentCurrency, Record<PlanId, RegionalPlanPrice>> = {
  TRY: {
    FREE: { monthly: 0, yearlyMonthly: 0, currency: 'TRY' },
    STARTER: { monthly: 490, yearlyMonthly: 392, currency: 'TRY' },
    PRO: { monthly: 990, yearlyMonthly: 792, currency: 'TRY' },
    BUSINESS: { monthly: 2490, yearlyMonthly: 1992, currency: 'TRY' },
  },
  EUR: {
    FREE: { monthly: 0, yearlyMonthly: 0, currency: 'EUR' },
    STARTER: { monthly: 19, yearlyMonthly: 15, currency: 'EUR' },
    PRO: { monthly: 39, yearlyMonthly: 31, currency: 'EUR' },
    BUSINESS: { monthly: 99, yearlyMonthly: 79, currency: 'EUR' },
  },
  USD: {
    FREE: { monthly: 0, yearlyMonthly: 0, currency: 'USD' },
    STARTER: { monthly: 25, yearlyMonthly: 20, currency: 'USD' },
    PRO: { monthly: 49, yearlyMonthly: 39, currency: 'USD' },
    BUSINESS: { monthly: 129, yearlyMonthly: 103, currency: 'USD' },
  },
  GBP: {
    FREE: { monthly: 0, yearlyMonthly: 0, currency: 'GBP' },
    STARTER: { monthly: 17, yearlyMonthly: 14, currency: 'GBP' },
    PRO: { monthly: 35, yearlyMonthly: 28, currency: 'GBP' },
    BUSINESS: { monthly: 89, yearlyMonthly: 71, currency: 'GBP' },
  },
  CHF: {
    FREE: { monthly: 0, yearlyMonthly: 0, currency: 'CHF' },
    STARTER: { monthly: 19, yearlyMonthly: 15, currency: 'CHF' },
    PRO: { monthly: 39, yearlyMonthly: 31, currency: 'CHF' },
    BUSINESS: { monthly: 99, yearlyMonthly: 79, currency: 'CHF' },
  },
  NOK: {
    FREE: { monthly: 0, yearlyMonthly: 0, currency: 'NOK' },
    STARTER: { monthly: 199, yearlyMonthly: 159, currency: 'NOK' },
    PRO: { monthly: 399, yearlyMonthly: 319, currency: 'NOK' },
    BUSINESS: { monthly: 999, yearlyMonthly: 799, currency: 'NOK' },
  },
}

export function getPlanPriceForCurrency(currency: PaymentCurrency, planId: PlanId): RegionalPlanPrice {
  return CURRENCY_PLAN_PRICES[currency][planId]
}

export function getPlanPriceForCountry(countryCode: string, planId: PlanId): RegionalPlanPrice {
  return getPlanPriceForCurrency(resolvePaymentCurrency(countryCode), planId)
}

/** @deprecated bölge yerine para birimi kullanın */
export function getRegionalPlanPrice(region: MarketRegion, planId: PlanId): RegionalPlanPrice {
  const currency =
    region === 'TR' ? 'TRY' : region === 'EU' ? 'EUR' : 'USD'
  return getPlanPriceForCurrency(currency, planId)
}

export function toMinorUnits(amount: number, currency: PaymentCurrency): number {
  return Math.round(amount * 100)
}

export function getExpectedMinorUnits(currency: PaymentCurrency, planId: PlanId): number {
  const p = getPlanPriceForCurrency(currency, planId)
  return toMinorUnits(p.monthly, p.currency)
}

export function trPlanPriceTry(planId: PlanId): number {
  return CURRENCY_PLAN_PRICES.TRY[planId].monthly
}

/** Callback doğrulama — her iyzico para birimindeki fiyatla eşleşme */
export function matchPlanPayment(
  planId: PlanId,
  paidAmount: number,
): { currency: PaymentCurrency; matched: boolean } | null {
  const currencies = Object.keys(CURRENCY_PLAN_PRICES) as PaymentCurrency[]
  for (const currency of currencies) {
    const expected = getPlanPriceForCurrency(currency, planId).monthly
    if (Math.abs(expected - paidAmount) < 0.02) {
      return { currency, matched: true }
    }
  }
  return null
}
