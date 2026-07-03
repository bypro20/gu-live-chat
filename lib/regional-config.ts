/** Bölgesel pazar — dil, para birimi (iyzico), ödeme sağlayıcı */

export type MarketRegion = 'TR' | 'EU' | 'GLOBAL'
export type SiteLocale = 'tr' | 'en'
/** iyzico checkoutform desteklediği para birimleri */
export type PaymentCurrency = 'TRY' | 'EUR' | 'USD' | 'GBP' | 'NOK' | 'CHF'
export type PaymentProvider = 'iyzico'

/** Bilinmeyen ülke / bot — AB varsayılanı */
export const GLOBAL_FALLBACK_COUNTRY = 'DE'

export const LOCALE_COOKIE = 'gu_locale'
export const LOCALE_MANUAL_COOKIE = 'gu_locale_manual'
export const REGION_COOKIE = 'gu_region'
export const COUNTRY_COOKIE = 'gu_country'

/** Avrupa + komşu pazarlar (EUR bölgesi fiyatlandırması) */
export const EU_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'GB', 'CH', 'NO', 'IS', 'LI',
])

const GBP_COUNTRIES = new Set(['GB'])
const CHF_COUNTRIES = new Set(['CH', 'LI'])
const NOK_COUNTRIES = new Set(['NO'])

export function resolveRegion(countryCode: string | null | undefined): MarketRegion {
  const cc = (countryCode || GLOBAL_FALLBACK_COUNTRY).toUpperCase()
  if (cc === 'TR') return 'TR'
  if (EU_COUNTRY_CODES.has(cc)) return 'EU'
  return 'GLOBAL'
}

/** Ülkeye göre iyzico ödeme para birimi */
export function resolvePaymentCurrency(countryCode: string | null | undefined): PaymentCurrency {
  const cc = (countryCode || GLOBAL_FALLBACK_COUNTRY).toUpperCase()
  if (cc === 'TR') return 'TRY'
  if (GBP_COUNTRIES.has(cc)) return 'GBP'
  if (CHF_COUNTRIES.has(cc)) return 'CHF'
  if (NOK_COUNTRIES.has(cc)) return 'NOK'
  if (EU_COUNTRY_CODES.has(cc)) return 'EUR'
  return 'USD'
}

export function defaultLocaleForCountry(countryCode: string | null | undefined): SiteLocale {
  return (countryCode || '').toUpperCase() === 'TR' ? 'tr' : 'en'
}

export function defaultLocaleForRegion(region: MarketRegion): SiteLocale {
  return region === 'TR' ? 'tr' : 'en'
}

export function parseLocale(value: string | null | undefined): SiteLocale | null {
  if (value === 'tr' || value === 'en') return value
  return null
}

export function intlLocaleFor(currency: PaymentCurrency, locale: SiteLocale): string {
  if (locale === 'tr') return 'tr-TR'
  const map: Record<PaymentCurrency, string> = {
    TRY: 'tr-TR',
    EUR: 'en-GB',
    USD: 'en-US',
    GBP: 'en-GB',
    CHF: 'de-CH',
    NOK: 'nb-NO',
  }
  return map[currency]
}

export function regionLabel(region: MarketRegion): string {
  if (region === 'TR') return 'Türkiye'
  if (region === 'EU') return 'Europe'
  return 'Global'
}

export function regionFlag(region: MarketRegion): string {
  if (region === 'TR') return '🇹🇷'
  if (region === 'EU') return '🇪🇺'
  return '🌍'
}

/** Ülke kodundan tam ödeme/yerelleştirme profili */
export function countryPaymentProfile(countryCode: string | null | undefined) {
  const country = (countryCode || GLOBAL_FALLBACK_COUNTRY).toUpperCase()
  const region = resolveRegion(country)
  const currency = resolvePaymentCurrency(country)
  const defaultLocale = defaultLocaleForCountry(country)
  return {
    country,
    region,
    currency,
    defaultLocale,
    paymentProvider: 'iyzico' as const,
    intlLocale: intlLocaleFor(currency, defaultLocale),
    flag: regionFlag(region),
    label: regionLabel(region),
  }
}

/** @deprecated regionConfig — countryPaymentProfile kullanın */
export function regionConfig(region: MarketRegion) {
  const currency =
    region === 'TR' ? ('TRY' as const) : region === 'EU' ? ('EUR' as const) : ('USD' as const)
  const defaultLocale = defaultLocaleForRegion(region)
  return {
    region,
    defaultLocale,
    currency,
    paymentProvider: 'iyzico' as const,
    intlLocale: intlLocaleFor(currency, defaultLocale),
    flag: regionFlag(region),
    label: regionLabel(region),
  }
}

/** Tarayıcı dili — site kataloğu tr/en; diğer diller İngilizce arayüz */
export function parseAcceptLanguage(header: string | null): SiteLocale | null {
  if (!header) return null
  for (const part of header.split(',')) {
    const code = part.split(';')[0]?.trim().split('-')[0]?.toLowerCase()
    if (code === 'tr') return 'tr'
    if (code === 'en') return 'en'
    if (code && code.length === 2) return 'en'
  }
  return null
}
