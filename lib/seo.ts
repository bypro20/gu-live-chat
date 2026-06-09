import type { Metadata } from 'next'
import { SITE_LEGAL } from '@/lib/site-legal'

export const SITE_URL = SITE_LEGAL.url.replace(/\/$/, '')

/** Ana hedef anahtar kelimeler — Türkçe canlı destek SaaS */
export const SEO_KEYWORDS = [
  'canlı destek',
  'canlı destek yazılımı',
  'live chat',
  'live chat yazılımı',
  'chatbot',
  'müşteri hizmetleri yazılımı',
  'müşteri destek platformu',
  'canlı sohbet widget',
  'whatsapp canlı destek',
  'whatsapp müşteri hizmetleri',
  'ziyaretçi takibi',
  'AI müşteri desteği',
  'birleşik inbox',
  'Gu Chat',
  'guchat',
  'Türk canlı destek',
  'e-ticaret canlı destek',
  'online müşteri hizmetleri',
] as const

/** Google Search Console doğrulama — env ile override edilebilir */
export const GOOGLE_SITE_VERIFICATION_CODE =
  process.env.GOOGLE_SITE_VERIFICATION || '6rvC_wtUp9XHeIa0nxjGglIILkJjEW440tlaGqFbXVQ'

/** Google/Bing doğrulama meta — env'den otomatik */
export function getSiteVerificationMetadata(): Pick<Metadata, 'verification'> {
  const google = GOOGLE_SITE_VERIFICATION_CODE
  const bing = process.env.BING_SITE_VERIFICATION
  const yandex = process.env.YANDEX_SITE_VERIFICATION

  return {
    verification: {
      ...(google ? { google } : {}),
      ...(yandex ? { yandex } : {}),
      ...(bing ? { other: { 'msvalidate.01': bing } } : {}),
    },
  }
}

export type PageMeta = {
  title: string
  description: string
  path: string
  keywords?: readonly string[]
  ogImage?: string
}

export function buildMetadata({
  title,
  description,
  path,
  keywords = [],
  ogImage,
}: PageMeta): Metadata {
  const url = `${SITE_URL}${path}`
  const fullTitle = path === '' ? `${SITE_LEGAL.name} — ${title}` : title
  const allKeywords = [...new Set([...SEO_KEYWORDS.slice(0, 8), ...keywords])]

  return {
    title: path === '' ? { default: fullTitle, template: `%s | ${SITE_LEGAL.name}` } : title,
    description,
    keywords: allKeywords,
    alternates: { canonical: url },
    ...getSiteVerificationMetadata(),
    openGraph: {
      type: 'website',
      locale: 'tr_TR',
      url,
      siteName: SITE_LEGAL.name,
      title: fullTitle,
      description,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  }
}

export const PAGE_SEO = {
  home: {
    title: SITE_LEGAL.tagline,
    description:
      'Gu Chat — Türkiye\'nin canlı destek ve chatbot platformu. Web sitenize 30 saniyede canlı sohbet ekleyin, WhatsApp ve AI ile müşterilerinize anında ulaşın. 14 gün ücretsiz deneyin.',
    path: '',
    keywords: ['canlı destek yazılımı', 'live chat türkiye', 'ücretsiz canlı destek'],
  },
  features: {
    title: 'Canlı Destek Özellikleri — AI, Widget, Inbox & Entegrasyonlar',
    description:
      'Gu Chat özellikleri: canlı sohbet widget, AI chatbot, WhatsApp entegrasyonu, ziyaretçi takibi, ekran izleme, 50+ dil çeviri ve birleşik gelen kutusu. Müşteri hizmetlerinizi tek platformda yönetin.',
    path: '/features',
    keywords: ['canlı destek özellikleri', 'chatbot özellikleri', 'müşteri destek araçları'],
  },
  pricing: {
    title: 'Fiyatlandırma — Ücretsiz Canlı Destek Paketi ile Başlayın',
    description:
      'Gu Chat fiyatları: Ücretsiz, Başlangıç (₺1.790/ay), Profesyonel (₺3.790/ay) ve Kurumsal paketler. Canlı destek, chatbot ve AI — ihtiyacınıza göre ölçeklenin. 14 gün ücretsiz deneme.',
    path: '/pricing',
    keywords: ['canlı destek fiyat', 'live chat ücret', 'chatbot fiyatlandırma'],
  },
  ai: {
    title: 'AI Müşteri Desteği — Yapay Zeka Chatbot & Otomatik Yanıt',
    description:
      'Gu Chat AI asistanı tekrarlayan müşteri sorularını 7/24 otomatik yanıtlar. GPT/Gemini destekli chatbot, bilgi bankası entegrasyonu ve akıllı temsilci yönlendirme.',
    path: '/ai',
    keywords: ['AI müşteri hizmetleri', 'yapay zeka chatbot', 'otomatik müşteri desteği'],
  },
  integrations: {
    title: 'Entegrasyonlar — WhatsApp, API, Webhook & E-posta',
    description:
      'Gu Chat entegrasyonları: WhatsApp Business, Facebook Messenger, Telegram, REST API, webhook, e-posta kanalı. Mevcut sistemlerinize kolayca bağlanın.',
    path: '/integrations',
    keywords: ['whatsapp entegrasyonu', 'canlı destek API', 'messenger entegrasyonu'],
  },
  blog: {
    title: 'Blog — Canlı Destek, Chatbot & Müşteri Deneyimi Rehberleri',
    description:
      'Gu Chat blog: canlı destek ipuçları, chatbot kurulum rehberleri, e-ticaret müşteri hizmetleri ve AI destek stratejileri. Satış ve memnuniyeti artırın.',
    path: '/blog',
    keywords: ['canlı destek rehberi', 'müşteri deneyimi blog'],
  },
  contact: {
    title: 'İletişim — Demo Talep & Satış',
    description:
      'Gu Chat ekibiyle iletişime geçin. Demo talep edin, kurumsal fiyatlandırma ve SLA seçeneklerini öğrenin. 7/24 destek.',
    path: '/contact',
  },
  canliDestek: {
    title: 'Canlı Destek Yazılımı — Web Sitenize Anında Canlı Sohbet',
    description:
      'Gu Chat canlı destek yazılımı ile ziyaretçilerinize gerçek zamanlı yanıt verin. Widget kurulumu 30 saniye, proaktif mesajlar, ziyaretçi takibi ve AI destek. Türkiye\'de üretildi, KVKK uyumlu.',
    path: '/canli-destek',
    keywords: ['canlı destek yazılımı', 'canlı destek programı', 'web sitesi canlı sohbet', 'live chat türkiye'],
  },
  chatbot: {
    title: 'Chatbot Yazılımı — 7/24 Otomatik Müşteri Hizmetleri',
    description:
      'Gu Chat chatbot ile tekrarlayan soruları otomatik yanıtlayın. Görsel akış editörü, AI destekli yanıtlar, bilgi bankası entegrasyonu. Temsilci yükünü %60\'a kadar azaltın.',
    path: '/chatbot',
    keywords: ['chatbot yazılımı', 'müşteri hizmetleri chatbot', 'otomatik yanıt sistemi', 'AI chatbot türkiye'],
  },
  whatsappDestek: {
    title: 'WhatsApp Canlı Destek — Müşterilerinize WhatsApp\'tan Ulaşın',
    description:
      'Gu Chat WhatsApp Business entegrasyonu ile WhatsApp mesajlarını tek inbox\'ta yönetin. Canlı destek, chatbot ve ekip ataması — hepsi bir arada.',
    path: '/whatsapp-destek',
    keywords: ['whatsapp canlı destek', 'whatsapp müşteri hizmetleri', 'whatsapp business destek'],
  },
} as const

/** Organization + WebSite JSON-LD */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_LEGAL.name,
        legalName: SITE_LEGAL.legalName,
        url: SITE_URL,
        email: SITE_LEGAL.email,
        telephone: SITE_LEGAL.phone,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'İstanbul',
          addressCountry: 'TR',
          streetAddress: SITE_LEGAL.address,
        },
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_LEGAL.name,
        description: SITE_LEGAL.metaDescription,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'tr-TR',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/help?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
}

/** SoftwareApplication JSON-LD for product pages */
export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_LEGAL.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TRY',
      description: 'Ücretsiz paket mevcut — 14 gün deneme',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
      bestRating: '5',
    },
    description: SITE_LEGAL.metaDescription,
    url: SITE_URL,
    inLanguage: 'tr-TR',
  }
}

export function faqJsonLd(faqs: ReadonlyArray<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }
}

export function articleJsonLd(article: {
  title: string
  description: string
  path: string
  datePublished: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.datePublished,
    author: { '@type': 'Organization', name: SITE_LEGAL.name },
    publisher: {
      '@type': 'Organization',
      name: SITE_LEGAL.name,
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}${article.path}`,
    inLanguage: 'tr-TR',
  }
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}
