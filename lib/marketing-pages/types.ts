import type { SeoLandingConfig } from '@/components/marketing/seo-landing-page'

export type MarketingCommon = {
  legal: string
  corporate: string
  security: string
  startFree: string
  seePricing: string
  readMore: string
  buyNow: string
  active: string
  addon: string
  popular: string
  detail: string
  seeDetails: string
  customIntegration: string
  freeLabel: string
  perMonth: string
  productDetails: string
  getQuote: string
  notFoundHelp: string
  contactSupport: string
  menuAria: string
}

export type LegalSection = { title: string; paragraphs: string[] }

export type LegalPage = {
  badge: string
  title: string
  subtitle?: string
  updated?: string
  sections: LegalSection[]
}

export type FeaturesPage = {
  badge: string
  title: string
  subtitle: string
  ctaTitle: string
  ctaNote: string
  items: { id?: string; title: string; desc: string }[]
}

export type IntegrationsPage = {
  badge: string
  title: string
  subtitle: string
  messagingTitle: string
  messagingSubtitle: string
  automationTitle: string
  automationSubtitle: string
  ecommerceTitle: string
  ecommerceSubtitle: string
  ctaTitle: string
  ctaSubtitle: string
  customIntegration: string
  messaging: { name: string; desc: string; status: 'active' | 'addon'; href?: string }[]
  automation: { name: string; desc: string; status: 'active' | 'addon'; href?: string }[]
  ecommerce: { name: string; desc: string; status: 'active' | 'addon' }[]
}

export type AiPage = {
  badge: string
  title: string
  subtitle: string
  howTitle: string
  howSubtitle: string
  steps: string[]
  stats: string[]
  ctaTitle: string
  ctaSubtitle: string
  capabilities: { title: string; desc: string }[]
}

export type ContactPage = {
  badge: string
  title: string
  subtitle: string
  email: string
  emailNote: string
  liveChat: string
  liveChatNote: string
  liveChatAction: string
  enterprise: string
  enterpriseNote: string
  enterpriseAction: string
  corporateInfo: string
  helpCenter: string
  formTitle: string
  formSubtitle: string
  nameLabel: string
  namePlaceholder: string
  emailLabel: string
  emailPlaceholder: string
  subjectLabel: string
  messageLabel: string
  messagePlaceholder: string
  submit: string
  submitting: string
  privacyNote: string
  privacyLink: string
  subjects: { demo: string; general: string; enterprise: string; support: string }
  toastSuccessTitle: string
  toastSuccessDesc: string
  toastErrorTitle: string
  toastLiveChatTitle: string
  toastLiveChatDesc: string
  sendError: string
}

export type HelpPage = {
  badge: string
  title: string
  subtitle: string
  notFound: string
  contactCta: string
  categories: { title: string; articles: { q: string; a: string }[] }[]
}

export type AppsPage = {
  badge: string
  title: string
  subtitle: string
  catalogLink: string
  customAddon: string
  contactCta: string
  items: { name: string; desc: string; price: string; status: string }[]
}

export type BlogPage = {
  badge: string
  title: string
  subtitle: string
  readMore: string
  backToBlog: string
  ctaTitle: string
  ctaButton: string
  homeCrumb: string
  blogCrumb: string
  notFound: string
  trialNote: string
}

export type KnowledgePage = {
  titleSuffix: string
  subtitle: string
  homeLink: string
  searchPlaceholder: string
  allArticles: string
  back: string
  views: string
  featuredTitle: string
  allArticlesTitle: string
  noResultsTitle: string
  noResultsDesc: string
  helpful: string
  footerPowered: string
}

export type UrunlerPage = {
  heroBadge: string
  heroTitle: string
  heroSubtitle: string
  packagesBtn: string
  addonsBtn: string
  packagesTitle: string
  packagesSubtitle: string
  monthly: string
  yearly: string
  yearlyDiscount: string
  billingAria: string
  addonsTitle: string
  addonsSubtitle: string
  active: string
  buyNow: string
  startFree: string
  getQuote: string
  productDetails: string
  paymentNote: string
  comparePricing: string
  freeProduct: string
  perMonth: string
}

export type HakkimizdaPage = LegalPage & {
  servicesTitle: string
  servicesText: string
  sslTitle: string
  sslText: string
  salesTitle: string
  salesText: string
  paymentTitle: string
  paymentText: string
  legalDocsTitle: string
  legalLinks: { label: string; href: string }[]
  corpFields: { tradeName: string; address: string; mersis: string; taxOffice: string; taxNo: string; email: string; phone: string; web: string }
}

export type AdsLanding = {
  login: string
  badge: string
  title: string
  titleHighlight: string
  subtitle: string
  proofs: string[]
  bullets: string[]
  cta: string
  statSetup: string
  statSetupLabel: string
  statConversion: string
  statConversionLabel: string
  statCompliance: string
  statComplianceLabel: string
  disclaimer: string
  copyright: string
}

export type SeoLandingChrome = {
  homeCrumb: string
  seePricing: string
  faqTitle: string
  tryFreeTitle: string
  tryFreeDesc: (trial: string) => string
  tryFreeCta: string
  relatedTitle: string
}

export type SeoLandingKey = 'canliDestek' | 'chatbot' | 'whatsappDestek'

export type MarketingPages = {
  common: MarketingCommon
  seoChrome: SeoLandingChrome
  features: FeaturesPage
  integrations: IntegrationsPage
  ai: AiPage
  contact: ContactPage
  help: HelpPage
  apps: AppsPage
  blog: BlogPage
  knowledge: KnowledgePage
  urunler: UrunlerPage
  hakkimizda: HakkimizdaPage
  ads: AdsLanding
  seoLandings: Record<SeoLandingKey, Omit<SeoLandingConfig, 'meta'>>
  legal: {
    gizlilik: LegalPage
    teslimatIade: LegalPage
    mesafeliSatis: LegalPage
    odemeGuvenligi: LegalPage
    kvkk: LegalPage
    cerez: LegalPage
    kullanimSartlari: LegalPage
  }
}
