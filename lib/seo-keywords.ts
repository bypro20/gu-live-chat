import { SITE_DOMAIN, SITE_NAME } from './site-config'

/** Marka + niş anahtar kelimeler — meta keywords ve içerik optimizasyonu */
export const BRAND_KEYWORDS = [
  SITE_NAME.toLowerCase(),
  SITE_DOMAIN,
  'gulivechat',
  'gu live chat',
] as const

/** Türkçe — birincil hedef arama niyeti */
export const SEO_KEYWORDS_TR = [
  ...BRAND_KEYWORDS,
  'canlı destek',
  'canlı destek yazılımı',
  'canlı destek programı',
  'canlı sohbet',
  'live chat',
  'live chat yazılımı',
  'chatbot',
  'chatbot yazılımı',
  'müşteri hizmetleri yazılımı',
  'müşteri destek platformu',
  'canlı sohbet widget',
  'whatsapp canlı destek',
  'whatsapp müşteri hizmetleri',
  'birleşik inbox',
  'AI müşteri desteği',
  'yapay zeka chatbot',
  'e-ticaret canlı destek',
  'Türk canlı destek',
  'KVKK uyumlu canlı destek',
] as const

/** İngilizce — uluslararası / EN locale */
export const SEO_KEYWORDS_EN = [
  ...BRAND_KEYWORDS,
  'live chat software',
  'customer support platform',
  'live chat widget',
  'AI chatbot',
  'whatsapp customer support',
  'unified inbox',
  'helpdesk software',
  'customer service automation',
] as const

export function mergePageKeywords(
  locale: 'tr' | 'en',
  pageKeywords: readonly string[] = []
): string[] {
  const base = locale === 'en' ? SEO_KEYWORDS_EN : SEO_KEYWORDS_TR
  return [...new Set([...pageKeywords, ...base.slice(0, 6), ...BRAND_KEYWORDS])]
}
