import type { SiteLocale } from './regional-config'
import type { PlanId } from './plan-cta'
import type { PlanType } from './constants'
import { PLAN_LIMITS } from './constants'

export type PlanCatalogEntry = {
  name: string
  description: string
  features: string[]
}

const catalogTr: Record<PlanId, PlanCatalogEntry> = {
  FREE: {
    name: 'Ücretsiz',
    description: 'Küçük işletmeler için temel canlı destek',
    features: ['2 temsilci', '300 sohbet/ay', 'Temel widget', 'E-posta bildirimleri', 'Temel istatistikler'],
  },
  STARTER: {
    name: 'Başlangıç',
    description: 'Büyüyen işletmeler için gelişmiş özellikler',
    features: [
      '5 temsilci',
      '1.000 sohbet/ay',
      'Ziyaretçi takibi & proaktif mesajlar',
      'Bilgi bankası (makale) & bilet sistemi',
      'Hazır cevaplar & dosya yükleme',
      'Eklenti: AI Sohbet, RAG, Copilot, Sesli AI',
      'Eklenti: WhatsApp, SMS, LinkedIn kanalları',
    ],
  },
  PRO: {
    name: 'Profesyonel',
    description: 'Profesyonel ekipler için tam AI destek platformu',
    features: [
      '25 temsilci',
      'Sınırsız sohbet',
      'AI Sohbet + RAG + Copilot + Sesli AI',
      'WhatsApp, SMS, LinkedIn & tüm kanallar',
      'Chatbot, web araması & AI analitik',
      '50+ dil çeviri & ekran izleme',
      'Kampanya, otomasyon, API & gelişmiş raporlar',
    ],
  },
  BUSINESS: {
    name: 'Kurumsal',
    description: 'Kurumsal çözümler için sınırsız paket',
    features: [
      'Sınırsız temsilci & sohbet',
      'Profesyonel AI platformu dahil',
      'Premium AI modelleri (GPT-4o, Claude Opus)',
      'White-label & SLA %99.9',
      '7/24 öncelikli destek & özel entegrasyon',
    ],
  },
}

const catalogEn: Record<PlanId, PlanCatalogEntry> = {
  FREE: {
    name: 'Free',
    description: 'Essential live chat for small businesses',
    features: ['2 agents', '300 chats/month', 'Basic widget', 'Email notifications', 'Basic analytics'],
  },
  STARTER: {
    name: 'Starter',
    description: 'Advanced features for growing businesses',
    features: [
      '5 agents',
      '1,000 chats/month',
      'Visitor tracking & proactive messages',
      'Knowledge base (articles) & ticketing',
      'Canned replies & file uploads',
      'Add-ons: AI chat, RAG, Copilot, Voice AI',
      'Add-ons: WhatsApp, SMS, LinkedIn channels',
    ],
  },
  PRO: {
    name: 'Professional',
    description: 'Full AI support platform for professional teams',
    features: [
      '25 agents',
      'Unlimited chats',
      'AI chat + RAG + Copilot + Voice AI',
      'WhatsApp, SMS, LinkedIn & all channels',
      'Chatbot, web search & AI analytics',
      '50+ language translate & screen co-browse',
      'Campaigns, automation, API & advanced reports',
    ],
  },
  BUSINESS: {
    name: 'Business',
    description: 'Unlimited plan for enterprise teams',
    features: [
      'Unlimited agents & chats',
      'Professional AI platform included',
      'Premium AI models (GPT-4o, Claude Opus)',
      'White-label & 99.9% SLA',
      '24/7 priority support & custom integration',
    ],
  },
}

export function getPlanCatalog(locale: SiteLocale): Record<PlanId, PlanCatalogEntry> {
  return locale === 'en' ? catalogEn : catalogTr
}

export function getPlanEntry(locale: SiteLocale, planId: PlanId): PlanCatalogEntry {
  return getPlanCatalog(locale)[planId]
}

export function formatPlanCount(n: number, locale: SiteLocale): string {
  if (n === Infinity) return locale === 'en' ? 'Unlimited' : 'Sınırsız'
  return n.toLocaleString(locale === 'en' ? 'en-US' : 'tr-TR')
}

export function buildPlanCardFeatures(
  planId: PlanType,
  locale: SiteLocale
): { label: string; included: boolean }[] {
  const l = PLAN_LIMITS[planId]
  const en = locale === 'en'
  const agents = formatPlanCount(l.maxAgents, locale)
  const chats = formatPlanCount(l.maxConversationsPerMonth, locale)

  const features = [
    { label: en ? `${agents} agents` : `${agents} temsilci`, included: true },
    { label: en ? `${chats} chats/month` : `${chats} sohbet/ay`, included: true },
    { label: en ? 'Live chat widget' : "Canlı sohbet widget'ı", included: true },
    { label: en ? 'Shared inbox' : 'Paylaşımlı gelen kutusu', included: true },
    { label: en ? 'Basic analytics' : 'Temel analitik', included: true },
    { label: en ? 'Visitor tracking' : 'Ziyaretçi takibi', included: l.visitorTracking },
    { label: en ? 'Chatbot builder' : 'Chatbot oluşturucu', included: l.chatbot },
    { label: en ? 'Knowledge base (articles)' : 'Bilgi bankası (makale)', included: l.knowledgeBase },
    { label: en ? 'AI knowledge training (RAG)' : 'AI bilgi eğitimi (RAG)', included: l.aiRag },
    { label: en ? 'Ticketing system' : 'Bilet sistemi', included: l.ticketing },
    { label: en ? 'Canned replies' : 'Hazır cevaplar', included: l.cannedResponses },
    { label: en ? 'CSAT ratings' : 'CSAT puanlama', included: l.ratings },
    { label: en ? 'Proactive messages' : 'Proaktif mesajlar', included: l.proactiveMessages },
    { label: en ? 'File sharing' : 'Dosya paylaşımı', included: l.fileUpload },
    { label: en ? 'Screen monitoring & co-browse' : 'Ekran izleme & müdahale', included: l.overlayAI },
    { label: en ? 'AI assistant (plan-tier models)' : 'AI Sohbet Asistanı (pakete göre modeller)', included: l.aiAssistant },
    { label: en ? 'AI Copilot (inbox suggestions)' : 'AI Copilot (inbox önerileri)', included: l.aiAssistant },
    { label: en ? 'Voice AI agent' : 'Sesli AI asistan', included: l.aiAssistant },
    { label: en ? '50+ language two-way auto-translate' : '50+ dil çift yönlü otomatik çeviri', included: l.autoTranslate },
    { label: en ? 'Email campaigns' : 'E-posta kampanyaları', included: l.campaigns },
    { label: en ? 'Multi-channel (WhatsApp, SMS, LinkedIn…)' : 'Çoklu kanal (WhatsApp, SMS, LinkedIn…)', included: l.multiChannel },
    { label: en ? 'Automation workflows' : 'Otomasyon iş akışları', included: l.workflows },
    { label: en ? 'Status page' : 'Durum sayfası', included: l.statusPage },
    { label: en ? 'API & Webhook' : 'API & Webhook', included: l.webhooks && l.apiAccess },
    { label: en ? 'Advanced analytics' : 'Gelişmiş analitik', included: l.advancedAnalytics },
    { label: en ? 'White-label (no watermark)' : 'Beyaz etiket (filigransız)', included: l.customBranding },
  ]

  if (planId === 'BUSINESS') {
    features.push(
      { label: en ? 'Custom SLA guarantee (99.9%)' : 'Özel SLA garantisi (%99.9)', included: true },
      { label: en ? '24/7 priority support' : '7/24 öncelikli destek', included: true }
    )
  }

  return features
}

export type PlansPanelUi = {
  perMonth: string
  free: string
  currentPlan: string
  popular: string
  buyNow: string
  buyNowCheckout: string
  freePlan: string
  currentPlanLabel: string
  redirecting: string
  enterpriseOffer: string
  paymentNote: string
  billingLink: string
  trialNote: string
  title: string
  subtitle: string
  billingNav: string
  paymentSuccess: string
  paymentFailed: string
}

export function getPlansPanelUi(locale: SiteLocale): PlansPanelUi {
  if (locale === 'en') {
    return {
      perMonth: '/mo',
      free: 'Free',
      currentPlan: 'Current plan',
      popular: 'Most popular',
      buyNow: 'Buy Now',
      buyNowCheckout: 'Buy Now — Checkout',
      freePlan: 'Free Plan',
      currentPlanLabel: 'Your current plan',
      redirecting: 'Redirecting...',
      enterpriseOffer: 'Request enterprise quote',
      paymentNote: 'VAT included · Instant digital delivery ·',
      billingLink: 'My invoices',
      trialNote: 'Paid plans redirect to secure checkout. Your card is saved on first payment; subscription renews monthly.',
      title: 'Plans',
      subtitle: 'Choose your subscription — paid plans redirect to secure checkout.',
      billingNav: 'Billing →',
      paymentSuccess: 'Payment successful! Your plan has been updated.',
      paymentFailed: 'Payment could not be completed. You can try again.',
    }
  }
  return {
    perMonth: '/ay',
    free: 'Ücretsiz',
    currentPlan: 'Mevcut plan',
    popular: 'En popüler',
    buyNow: 'Satın Al',
    buyNowCheckout: 'Satın Al — Ödemeye Git',
    freePlan: 'Ücretsiz Plan',
    currentPlanLabel: 'Mevcut paketiniz',
    redirecting: 'Yönlendiriliyor...',
    enterpriseOffer: 'Kurumsal teklif iste',
    paymentNote: 'KDV dahil · Anında dijital teslimat ·',
    billingLink: 'Faturalarım',
    trialNote:
      'Ücretli paketlerde güvenli ödeme ekranına yönlendirilirsiniz. İlk ödemede kartınız kaydedilir; abonelik aylık otomatik yenilenir.',
    title: 'Paketler',
    subtitle: 'Abonelik paketinizi seçin — ücretli paketlerde doğrudan güvenli ödeme ekranına yönlendirilirsiniz.',
    billingNav: 'Faturalama →',
    paymentSuccess: 'Ödeme başarılı! Paketiniz güncellendi.',
    paymentFailed: 'Ödeme tamamlanamadı. Tekrar deneyebilirsiniz.',
  }
}

export function getBillingPlanCtaLabel(
  planId: PlanId,
  locale: SiteLocale,
  opts: { isCurrentPlan?: boolean } = {}
): string {
  const ui = getPlansPanelUi(locale)
  if (opts.isCurrentPlan) return ui.currentPlan
  if (planId === 'FREE') return ui.freePlan
  return ui.buyNow
}
