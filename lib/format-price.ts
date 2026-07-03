import type { PaymentCurrency } from './regional-config'

const INTL_LOCALE: Record<PaymentCurrency, string> = {
  TRY: 'tr-TR',
  EUR: 'de-DE',
  USD: 'en-US',
  GBP: 'en-GB',
  CHF: 'de-CH',
  NOK: 'nb-NO',
}

export function formatPrice(
  amount: number,
  currency: PaymentCurrency,
  locale?: string
): string {
  const loc = locale || INTL_LOCALE[currency]
  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'TRY' ? 0 : 2,
    maximumFractionDigits: currency === 'TRY' ? 0 : 2,
  }).format(amount)
}

export function formatPriceCompact(amount: number, currency: PaymentCurrency): string {
  return formatPrice(amount, currency)
}
