import type { PaymentCurrency } from './regional-config'
import { formatPrice } from './format-price'

/** Addon seed fiyatları TRY tam sayı — diğer para birimlerine yaklaşık dönüşüm */
const TRY_RATES: Record<PaymentCurrency, number> = {
  TRY: 1,
  EUR: 1 / 35,
  USD: 1 / 32,
  GBP: 1 / 40,
  CHF: 1 / 38,
  NOK: 1 / 3.2,
}

export function addonAmountMajor(priceKurus: number, currency: PaymentCurrency): number {
  const tryMajor = priceKurus / 100
  if (currency === 'TRY') return tryMajor
  const converted = tryMajor * TRY_RATES[currency]
  return Math.max(1, Math.round(converted * 100) / 100)
}

export function formatAddonPrice(
  priceKurus: number,
  currency: PaymentCurrency,
  intlLocale?: string,
): string {
  if (priceKurus === 0) return ''
  return formatPrice(addonAmountMajor(priceKurus, currency), currency, intlLocale)
}

export function formatAddonMonthlyTry(
  tryMonthly: number,
  currency: PaymentCurrency,
  intlLocale?: string,
  suffix = '/mo',
): string {
  if (tryMonthly === 0) return ''
  const major =
    currency === 'TRY'
      ? tryMonthly
      : Math.max(1, Math.round(tryMonthly * TRY_RATES[currency] * 100) / 100)
  return `${formatPrice(major, currency, intlLocale)}${suffix}`
}
