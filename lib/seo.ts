import type { Metadata } from 'next'
import { SITE_LEGAL } from '@/lib/site-legal'
import { SITE_DOMAIN, SITE_NAME } from '@/lib/site-config'
import { mergePageKeywords, SEO_KEYWORDS_TR } from '@/lib/seo-keywords'
import { trialSeoHome, trialSeoPricing, TRIAL_DAYS } from '@/lib/trial-config'

export const SITE_URL = SITE_LEGAL.url.replace(/\/$/, '')

export { SEO_KEYWORDS_TR as SEO_KEYWORDS }

/** Google Search Console doğrulama — env ile override edilebilir */
export const GOOGLE_SITE_VERIFICATION_CODE =
  process.env.GOOGLE_SITE_VERIFICATION || 'PuI4LA0pzgjODjKhje4b8QMkmg7UwvJDaP-vs59zwEY'

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
  /** Sayfa başlığında marka öne alınsın (landing SEO sayfaları) */
  keywordFirst?: boolean
  locale?: 'tr' | 'en'
}

export function buildMetadata({
  title,
  description,
  path,
  keywords = [],
  ogImage,
  keywordFirst = false,
  locale = 'tr',
}: PageMeta): Metadata {
  const url = `${SITE_URL}${path}`
  const brand = SITE_NAME

  const fullTitle =
    path === ''
      ? `${brand} — ${title}`
      : keywordFirst
        ? `${title} | ${brand}`
        : `${title} | ${brand}`

  const allKeywords = mergePageKeywords(locale, keywords)
  const resolvedOg = ogImage ?? DEFAULT_OG_IMAGE
  const ogImageUrl = resolvedOg.startsWith('http') ? resolvedOg : `${SITE_URL}${resolvedOg}`

  return {
    title: path === '' ? { default: fullTitle, template: `%s | ${brand}` } : fullTitle,
    description,
    keywords: allKeywords,
    applicationName: brand,
    alternates: {
      canonical: url,
      types: { 'application/rss+xml': `${SITE_URL}/blog` },
    },
    ...getSiteVerificationMetadata(),
    openGraph: {
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'tr_TR',
      alternateLocale: locale === 'en' ? ['tr_TR'] : ['en_US'],
      url,
      siteName: brand,
      title: fullTitle,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${brand} — ${title}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    category: 'technology',
  }
}

export const DEFAULT_OG_IMAGE = '/og-image.png'

export const PAGE_SEO = {
  home: {
    title: 'Canlı Destek, Live Chat & AI Chatbot Platformu',
    description:
      `${SITE_NAME} (${SITE_DOMAIN}) — web sitenize 30 saniyede canlı sohbet ekleyin. WhatsApp, AI chatbot ve birleşik inbox. KVKK uyumlu, iyzico güvenli ödeme. ${trialSeoHome()}`,
    path: '',
    keywords: ['canlı destek yazılımı', 'live chat türkiye', 'gulivechat', 'ücretsiz canlı destek'],
  },
  features: {
    title: 'Canlı Destek Özellikleri',
    description:
      `${SITE_NAME} özellikleri: canlı sohbet widget, AI chatbot, WhatsApp entegrasyonu, ziyaretçi takibi, ekran paylaşımı, 50+ dil çeviri ve birleşik gelen kutusu. Müşteri hizmetlerinizi tek panelden yönetin.`,
    path: '/features',
    keywords: ['canlı destek özellikleri', 'chatbot özellikleri', 'müşteri destek araçları'],
    keywordFirst: true,
  },
  pricing: {
    title: 'Fiyatlandırma — Ücretsiz Paket ile Başlayın',
    description:
      `${SITE_NAME} fiyatları: Ücretsiz, Başlangıç, Profesyonel ve Kurumsal paketler. Canlı destek, chatbot ve AI — ihtiyacınıza göre ölçeklenin. ${trialSeoPricing()}`,
    path: '/pricing',
    keywords: ['canlı destek fiyat', 'live chat ücret', 'gulivechat fiyat'],
    keywordFirst: true,
  },
  urunler: {
    title: 'Abonelik Paketleri & Eklentiler',
    description:
      `${SITE_NAME} dijital abonelik ve eklentileri. WhatsApp kanalı, AI asistan, white-label ve daha fazlası — iyzico ile güvenli ödeme, anında dijital teslimat.`,
    path: '/urunler',
    keywords: ['canlı destek abonelik', 'saas satın al', 'gulivechat paketleri'],
    keywordFirst: true,
  },
  ai: {
    title: 'AI Müşteri Desteği & Yapay Zeka Chatbot',
    description:
      `${SITE_NAME} AI asistanı tekrarlayan müşteri sorularını 7/24 yanıtlar. GPT/Gemini destekli chatbot, bilgi bankası entegrasyonu ve akıllı temsilci yönlendirme.`,
    path: '/ai',
    keywords: ['AI müşteri hizmetleri', 'yapay zeka chatbot', 'otomatik müşteri desteği'],
    keywordFirst: true,
  },
  integrations: {
    title: 'Entegrasyonlar — WhatsApp, E-ticaret, API',
    description:
      `${SITE_NAME} entegrasyonları: Shopify, WooCommerce, İkas, Ticimax, IdeaSoft, WhatsApp, Messenger, Telegram, Slack, Zapier, REST API ve webhook.`,
    path: '/integrations',
    keywords: [
      'whatsapp entegrasyonu',
      'shopify canlı destek',
      'woocommerce chatbot',
      'ikas entegrasyonu',
      'e-ticaret müşteri hizmetleri',
    ],
    keywordFirst: true,
  },
  blog: {
    title: 'Blog — Canlı Destek & Müşteri Deneyimi Rehberleri',
    description:
      `${SITE_NAME} blog: canlı destek ipuçları, chatbot kurulum rehberleri, e-ticaret müşteri hizmetleri ve AI destek stratejileri.`,
    path: '/blog',
    keywords: ['canlı destek rehberi', 'müşteri deneyimi blog', 'gulivechat blog'],
  },
  contact: {
    title: 'İletişim — Demo & Satış',
    description:
      `${SITE_NAME} ekibiyle iletişime geçin. Demo talep edin, kurumsal fiyatlandırma ve SLA seçeneklerini öğrenin.`,
    path: '/contact',
    keywords: ['gu live chat iletişim', 'canlı destek demo'],
  },
  canliDestek: {
    title: 'Canlı Destek Yazılımı — Web Sitenize Anında Sohbet',
    description:
      `${SITE_NAME} ile ziyaretçilerinize gerçek zamanlı yanıt verin. Widget kurulumu 30 saniye, proaktif mesajlar, ziyaretçi takibi ve AI destek. KVKK uyumlu.`,
    path: '/canli-destek',
    keywords: ['canlı destek yazılımı', 'canlı destek programı', 'web sitesi canlı sohbet', 'live chat türkiye'],
    keywordFirst: true,
  },
  chatbot: {
    title: 'Chatbot Yazılımı — 7/24 Otomatik Müşteri Hizmetleri',
    description:
      `${SITE_NAME} chatbot ile tekrarlayan soruları otomatik yanıtlayın. Görsel akış editörü, AI yanıtlar ve bilgi bankası. Temsilci yükünü azaltın.`,
    path: '/chatbot',
    keywords: ['chatbot yazılımı', 'müşteri hizmetleri chatbot', 'AI chatbot türkiye'],
    keywordFirst: true,
  },
  whatsappDestek: {
    title: 'WhatsApp Canlı Destek — Tek Inbox\'ta Yönetin',
    description:
      `${SITE_NAME} WhatsApp Business entegrasyonu ile mesajları tek gelen kutusunda yönetin. Canlı destek, chatbot ve ekip ataması.`,
    path: '/whatsapp-destek',
    keywords: ['whatsapp canlı destek', 'whatsapp müşteri hizmetleri', 'whatsapp business destek'],
    keywordFirst: true,
  },
  basla: {
    title: 'Ücretsiz Başlayın — Canlı Destek & Chatbot',
    description:
      `${SITE_NAME} ile ücretsiz kayıt olun. Canlı sohbet widget, AI chatbot ve WhatsApp — tek platformda. Kredi kartı gerekmez.`,
    path: '/basla',
    keywords: ['ücretsiz canlı destek', 'gu live chat kayıt', 'gulivechat ücretsiz'],
    keywordFirst: true,
  },
} as const

function socialSameAs(): string[] {
  const s = SITE_LEGAL.social
  return [s.instagram, s.linkedin, s.youtube, s.x].filter(Boolean)
}

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
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/icon.png`,
          width: 512,
          height: 512,
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'İstanbul',
          addressCountry: 'TR',
          streetAddress: SITE_LEGAL.address,
        },
        ...(socialSameAs().length ? { sameAs: socialSameAs() } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_LEGAL.name,
        alternateName: [SITE_DOMAIN, 'gulivechat', 'Gu Live Chat'],
        description: SITE_LEGAL.metaDescription,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: ['tr-TR', 'en-US'],
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/help?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
}

/** SoftwareApplication JSON-LD — ana ürün */
export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#software`,
    name: SITE_LEGAL.name,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Customer Support Software',
    operatingSystem: 'Web, Android',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TRY',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/register`,
      description: `Ücretsiz paket — ${TRIAL_DAYS} gün PRO deneme`,
    },
    description: SITE_LEGAL.metaDescription,
    url: SITE_URL,
    image: `${SITE_URL}/og-image.png`,
    inLanguage: 'tr-TR',
    publisher: { '@id': `${SITE_URL}/#organization` },
    featureList: [
      'Canlı sohbet widget',
      'AI chatbot',
      'WhatsApp entegrasyonu',
      'Birleşik inbox',
      'Ziyaretçi takibi',
      'KVKK uyumu',
    ],
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
    author: { '@type': 'Organization', name: SITE_LEGAL.name, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: SITE_LEGAL.name,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.png` },
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

/** Landing sayfaları — WebPage + breadcrumb */
export function webPageJsonLd(page: { name: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_URL}${page.path}#webpage`,
    url: `${SITE_URL}${page.path}`,
    name: page.name,
    description: page.description,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#software` },
    inLanguage: 'tr-TR',
  }
}
