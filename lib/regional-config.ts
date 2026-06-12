/** Bölgesel pazar — dil, para birimi, ödeme sağlayıcı */

export type MarketRegion = 'TR' | 'EU' | 'GLOBAL'
export type SiteLocale = 'tr' | 'en'
export type PaymentCurrency = 'TRY' | 'EUR' | 'USD'
export type PaymentProvider = 'iyzico'

export const LOCALE_COOKIE = 'gu_locale'
export const LOCALE_MANUAL_COOKIE = 'gu_locale_manual'
export const REGION_COOKIE = 'gu_region'
export const COUNTRY_COOKIE = 'gu_country'

/** AB + İngiltere + İsviçre */
export const EU_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'GB', 'CH', 'NO', 'IS', 'LI',
])

export function resolveRegion(countryCode: string | null | undefined): MarketRegion {
  const cc = (countryCode || 'TR').toUpperCase()
  if (cc === 'TR') return 'TR'
  if (EU_COUNTRY_CODES.has(cc)) return 'EU'
  return 'GLOBAL'
}

export function defaultLocaleForCountry(countryCode: string | null | undefined): SiteLocale {
  return (countryCode || 'TR').toUpperCase() === 'TR' ? 'tr' : 'en'
}

export function defaultLocaleForRegion(region: MarketRegion): SiteLocale {
  return region === 'TR' ? 'tr' : 'en'
}

export function parseLocale(value: string | null | undefined): SiteLocale | null {
  if (value === 'tr' || value === 'en') return value
  return null
}

export function regionConfig(region: MarketRegion) {
  const map = {
    TR: {
      region: 'TR' as const,
      defaultLocale: 'tr' as const,
      currency: 'TRY' as const,
      paymentProvider: 'iyzico' as const,
      intlLocale: 'tr-TR',
      flag: '🇹🇷',
      label: 'Türkiye',
    },
    EU: {
      region: 'EU' as const,
      defaultLocale: 'en' as const,
      currency: 'EUR' as const,
      paymentProvider: 'iyzico' as const,
      intlLocale: 'en-EU',
      flag: '🇪🇺',
      label: 'Europe',
    },
    GLOBAL: {
      region: 'GLOBAL' as const,
      defaultLocale: 'en' as const,
      currency: 'USD' as const,
      paymentProvider: 'iyzico' as const,
      intlLocale: 'en-US',
      flag: '🌍',
      label: 'Global',
    },
  }
  return map[region]
}

export function parseAcceptLanguage(header: string | null): SiteLocale | null {
  if (!header) return null
  const primary = header.split(',')[0]?.split('-')[0]?.toLowerCase()
  if (primary === 'tr') return 'tr'
  if (primary === 'en') return 'en'
  return null
}
