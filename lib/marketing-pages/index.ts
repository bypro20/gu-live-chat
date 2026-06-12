import type { SiteLocale } from '@/lib/regional-config'
import type { MarketingPages } from './types'
import { marketingTr } from './tr'
import { marketingEn } from './en'

export function getMarketingPages(locale: SiteLocale): MarketingPages {
  return locale === 'en' ? marketingEn : marketingTr
}

export type { MarketingPages, SeoLandingKey, LegalPage } from './types'
