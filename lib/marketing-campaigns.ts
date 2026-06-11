import { SITE_LEGAL } from './site-legal'

const BASE = SITE_LEGAL.url.replace(/\/$/, '')

export type CampaignLink = {
  id: string
  label: string
  channel: string
  url: string
  tip: string
}

function withUtm(path: string, source: string, medium: string, campaign: string, content?: string) {
  const url = new URL(path, BASE)
  url.searchParams.set('utm_source', source)
  url.searchParams.set('utm_medium', medium)
  url.searchParams.set('utm_campaign', campaign)
  if (content) url.searchParams.set('utm_content', content)
  return url.toString()
}

/** Hazır reklam / sosyal medya linkleri — panellere yapıştırın */
export const MARKETING_CAMPAIGN_LINKS: CampaignLink[] = [
  {
    id: 'google-search-pro',
    label: 'Google Ads — Profesyonel paket',
    channel: 'Google Ads',
    url: withUtm('/register?plan=PRO', 'google', 'cpc', 'search-pro-trial'),
    tip: 'Anahtar kelime: canlı destek yazılımı, live chat türkiye',
  },
  {
    id: 'google-search-starter',
    label: 'Google Ads — Başlangıç paketi',
    channel: 'Google Ads',
    url: withUtm('/register?plan=STARTER', 'google', 'cpc', 'search-starter'),
    tip: 'Anahtar kelime: canlı destek fiyat, chatbot yazılımı',
  },
  {
    id: 'meta-ig-pro',
    label: 'Instagram / Facebook — PRO deneme',
    channel: 'Meta Ads',
    url: withUtm('/canli-destek', 'instagram', 'paid', 'pro-awareness', 'video-demo'),
    tip: '15 sn widget kurulum videosu + retargeting',
  },
  {
    id: 'meta-retarget',
    label: 'Meta — Retargeting (site ziyaretçisi)',
    channel: 'Meta Ads',
    url: withUtm('/pricing', 'facebook', 'retargeting', 'visited-no-signup'),
    tip: 'Pixel kurulu olmalı — siteyi ziyaret edip kayıt olmayanlar',
  },
  {
    id: 'linkedin-b2b',
    label: 'LinkedIn — B2B demo',
    channel: 'LinkedIn Ads',
    url: withUtm('/contact?konu=demo', 'linkedin', 'paid', 'b2b-demo'),
    tip: 'Hedef: E-ticaret Müdürü, Müşteri Hizmetleri, Operasyon',
  },
  {
    id: 'linkedin-organic',
    label: 'LinkedIn — Organik paylaşım',
    channel: 'LinkedIn',
    url: withUtm('/urunler', 'linkedin', 'social', 'product-catalog'),
    tip: 'Haftada 2 paylaşım: ürün + blog',
  },
  {
    id: 'whatsapp-landing',
    label: 'WhatsApp kanalı tanıtım',
    channel: 'Organik / Meta',
    url: withUtm('/whatsapp-destek', 'whatsapp', 'social', 'channel-promo'),
    tip: 'E-ticaret gruplarında paylaş',
  },
  {
    id: 'blog-seo',
    label: 'Blog — SEO trafik',
    channel: 'Organik',
    url: withUtm('/blog/canli-destek-neden-onemli', 'google', 'organic', 'blog-seo'),
    tip: 'Search Console ile indeks kontrolü',
  },
  {
    id: 'referral-partner',
    label: 'Referans ortağı',
    channel: 'Referral',
    url: `${BASE}/register?ref=PARTNER_KODU`,
    tip: 'ref= kodunu ajans/ortak adına özelleştirin',
  },
]

export const MARKETING_SETUP_STEPS = [
  {
    id: 'ga4',
    title: 'Google Analytics 4',
    env: 'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    doc: 'https://analytics.google.com/',
  },
  {
    id: 'google-ads',
    title: 'Google Ads dönüşüm',
    env: 'NEXT_PUBLIC_GOOGLE_ADS_ID + NEXT_PUBLIC_GOOGLE_ADS_*_CONVERSION',
    doc: 'https://ads.google.com/',
  },
  {
    id: 'meta',
    title: 'Meta Pixel (Instagram/Facebook)',
    env: 'NEXT_PUBLIC_META_PIXEL_ID',
    doc: 'https://business.facebook.com/events_manager',
  },
  {
    id: 'linkedin',
    title: 'LinkedIn Insight Tag',
    env: 'NEXT_PUBLIC_LINKEDIN_PARTNER_ID',
    doc: 'https://www.linkedin.com/campaignmanager/',
  },
  {
    id: 'search-console',
    title: 'Google Search Console',
    env: 'GOOGLE_SITE_VERIFICATION',
    doc: 'https://search.google.com/search-console',
  },
] as const
