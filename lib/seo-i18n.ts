import type { SiteLocale } from './regional-config'
import { SITE_DOMAIN, SITE_NAME } from './site-config'
import { PAGE_SEO, type PageMeta } from './seo'
import { trialSeoHome, trialSeoPricing } from './trial-config'

export type PageSeoKey = keyof typeof PAGE_SEO | 'help' | 'apps' | 'hakkimizda' | 'gizlilik' | 'teslimatIade' | 'mesafeliSatis' | 'odemeGuvenligi' | 'kvkk' | 'cerez' | 'kullanimSartlari' | 'basla'

const EN_SEO: Partial<Record<PageSeoKey, PageMeta>> = {
  home: {
    title: 'Live Chat, AI Chatbot & Customer Support Platform',
    description:
      `${SITE_NAME} (${SITE_DOMAIN}) — add live chat to your website in 30 seconds. WhatsApp, AI chatbot, and unified inbox. Secure iyzico payments. Free plan available.`,
    path: '',
    keywords: ['live chat software', 'customer support platform', 'gulivechat', 'free live chat'],
    locale: 'en',
  },
  features: {
    title: 'Live Chat Features — AI, Widget & Inbox',
    description:
      `${SITE_NAME} features: live chat widget, AI chatbot, WhatsApp integration, visitor tracking, screen sharing, 50+ languages, and unified inbox.`,
    path: '/features',
    keywords: ['live chat features', 'chatbot features', 'customer support tools'],
    keywordFirst: true,
    locale: 'en',
  },
  pricing: {
    title: 'Pricing — Start Free, Scale as You Grow',
    description:
      `${SITE_NAME} pricing: Free, Starter, Professional, and Business plans. Live chat, chatbot, and AI — multi-currency payments via iyzico.`,
    path: '/pricing',
    keywords: ['live chat pricing', 'gulivechat pricing', 'chatbot pricing'],
    keywordFirst: true,
    locale: 'en',
  },
  urunler: {
    title: 'Subscription Plans & Add-ons',
    description:
      `${SITE_NAME} digital subscriptions and add-ons. WhatsApp channel, AI assistant, white-label — secure iyzico payment, instant delivery.`,
    path: '/urunler',
    keywords: ['live chat subscription', 'saas pricing', 'gu live chat plans'],
    keywordFirst: true,
    locale: 'en',
  },
  ai: {
    title: 'AI Customer Support & Chatbot',
    description:
      `${SITE_NAME} AI assistant answers repetitive questions 24/7. GPT/Gemini chatbot, knowledge base, and smart agent handoff.`,
    path: '/ai',
    keywords: ['AI customer service', 'AI chatbot', 'automated support'],
    keywordFirst: true,
    locale: 'en',
  },
  integrations: {
    title: 'Integrations — WhatsApp, E-commerce, API',
    description:
      `${SITE_NAME} integrations: Shopify, WooCommerce, WhatsApp, Messenger, Telegram, Slack, Zapier, REST API, and webhooks.`,
    path: '/integrations',
    keywords: ['whatsapp integration', 'shopify live chat', 'ecommerce support'],
    keywordFirst: true,
    locale: 'en',
  },
  blog: {
    title: 'Blog — Live Chat & Customer Experience',
    description:
      `${SITE_NAME} blog: live chat tips, chatbot guides, e-commerce customer service, and AI support strategies.`,
    path: '/blog',
    keywords: ['live chat guide', 'customer experience', 'gulivechat blog'],
    locale: 'en',
  },
  contact: {
    title: 'Contact — Demo & Sales',
    description: `Contact the ${SITE_NAME} team. Request a demo or learn about enterprise pricing and SLA options.`,
    path: '/contact',
    locale: 'en',
  },
  canliDestek: {
    title: 'Live Chat Software for Your Website',
    description:
      `${SITE_NAME} lets you respond to visitors in real time. 30-second widget setup, proactive messages, visitor tracking, and AI support.`,
    path: '/canli-destek',
    keywords: ['live chat software', 'website live chat', 'live chat widget'],
    keywordFirst: true,
    locale: 'en',
  },
  chatbot: {
    title: 'Chatbot Software — 24/7 Automated Support',
    description:
      `${SITE_NAME} chatbot answers repetitive questions automatically. Visual flow editor, AI replies, knowledge base integration.`,
    path: '/chatbot',
    keywords: ['chatbot software', 'customer service chatbot'],
    keywordFirst: true,
    locale: 'en',
  },
  whatsappDestek: {
    title: 'WhatsApp Live Support — Unified Inbox',
    description:
      `${SITE_NAME} WhatsApp Business integration — manage messages in one inbox with live support, chatbot, and team assignment.`,
    path: '/whatsapp-destek',
    keywords: ['whatsapp live chat', 'whatsapp customer service'],
    keywordFirst: true,
    locale: 'en',
  },
  help: {
    title: 'Help Center',
    description: `${SITE_NAME} help center — setup, widget, chatbot, and frequently asked questions.`,
    path: '/help',
    locale: 'en',
  },
  apps: {
    title: 'Apps & Add-ons',
    description: `${SITE_NAME} add-on store — WhatsApp, AI Pro, white-label, and more. Secure iyzico subscription billing.`,
    path: '/apps',
    locale: 'en',
  },
  hakkimizda: {
    title: 'About Us',
    description: `${SITE_NAME} — live chat and AI customer support platform built in Turkey. ${SITE_DOMAIN}`,
    path: '/hakkimizda',
    locale: 'en',
  },
  gizlilik: {
    title: 'Privacy Policy',
    description: `${SITE_NAME} privacy policy and personal data protection.`,
    path: '/gizlilik',
    locale: 'en',
  },
  teslimatIade: {
    title: 'Delivery & Returns',
    description: `${SITE_NAME} digital service delivery and refund terms.`,
    path: '/teslimat-iade',
    locale: 'en',
  },
  mesafeliSatis: {
    title: 'Distance Sales Agreement',
    description: `${SITE_NAME} distance sales agreement and consumer rights.`,
    path: '/mesafeli-satis',
    locale: 'en',
  },
  odemeGuvenligi: {
    title: 'Payment Security',
    description: `${SITE_NAME} SSL and iyzico secure payment infrastructure.`,
    path: '/odeme-guvenligi',
    locale: 'en',
  },
  kvkk: {
    title: 'GDPR / KVKK Notice',
    description: 'Personal data protection under Turkish KVKK and GDPR practices.',
    path: '/kvkk',
    locale: 'en',
  },
  cerez: {
    title: 'Cookie Policy',
    description: `${SITE_NAME} cookie policy.`,
    path: '/cerez-politikasi',
    locale: 'en',
  },
  kullanimSartlari: {
    title: 'Terms of Use',
    description: `${SITE_NAME} terms of use and service agreement.`,
    path: '/kullanim-sartlari',
    locale: 'en',
  },
  basla: {
    title: 'Start Free — Live Chat for Your Business',
    description: `Start ${SITE_NAME} free. Live chat, AI chatbot, and WhatsApp in one inbox. No credit card required.`,
    path: '/basla',
    keywords: ['free live chat', 'gulivechat signup'],
    keywordFirst: true,
    locale: 'en',
  },
}

export function getPageSeo(locale: SiteLocale, key: PageSeoKey): PageMeta {
  if (locale === 'en' && EN_SEO[key]) return EN_SEO[key]!
  if (key in PAGE_SEO) return PAGE_SEO[key as keyof typeof PAGE_SEO]
  if (key === 'basla') return PAGE_SEO.basla
  return PAGE_SEO.home
}

export async function buildLocaleMetadata(locale: SiteLocale, key: PageSeoKey) {
  const { buildMetadata } = await import('./seo')
  const meta = getPageSeo(locale, key)
  return buildMetadata({
    ...meta,
    locale: locale === 'en' ? 'en' : 'tr',
  })
}
