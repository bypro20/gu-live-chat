import type { PlanId } from './plan-cta'

/** Pazarlama sitesi ürün kataloğu — iyzico başvuru incelemesi için net fiyat + satın alma linkleri */

export type SubscriptionProduct = {
  id: PlanId
  name: string
  description: string
  monthlyPrice: number
  yearlyMonthlyPrice: number
  badge?: string
  highlighted?: boolean
  features: string[]
  detailHref: string
}

export type AddonProduct = {
  slug: string
  name: string
  description: string
  monthlyPrice: number
  icon: string
  category: 'Kanallar' | 'AI & Otomasyon' | 'Analitik & Marka'
}

export const SUBSCRIPTION_PRODUCTS: SubscriptionProduct[] = [
  {
    id: 'FREE',
    name: 'Ücretsiz Paket',
    description: 'Canlı destek deneyimi için temel dijital abonelik paketi.',
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    features: ['2 temsilci', '100 sohbet/ay', 'Canlı sohbet widget', 'E-posta bildirimleri'],
    detailHref: '/canli-destek',
  },
  {
    id: 'STARTER',
    name: 'Başlangıç Paketi',
    description: 'Büyüyen işletmeler için aylık dijital abonelik — ziyaretçi takibi ve bilgi bankası.',
    monthlyPrice: 1790,
    yearlyMonthlyPrice: 1432,
    features: ['5 temsilci', '1.000 sohbet/ay', 'Ziyaretçi takibi', 'Bilgi bankası & bilet', 'Hazır cevaplar'],
    detailHref: '/canli-destek',
  },
  {
    id: 'PRO',
    name: 'Profesyonel Paket',
    description: 'Tam özellikli canlı destek platformu — AI, chatbot ve çoklu kanal dahil.',
    monthlyPrice: 3790,
    yearlyMonthlyPrice: 3032,
    badge: 'En çok tercih edilen',
    highlighted: true,
    features: ['25 temsilci', 'Sınırsız sohbet', 'AI sohbet asistanı', 'WhatsApp & Messenger', 'API & webhook'],
    detailHref: '/chatbot',
  },
  {
    id: 'BUSINESS',
    name: 'Kurumsal Paket',
    description: 'White-label, SLA ve özel entegrasyon içeren kurumsal dijital abonelik.',
    monthlyPrice: 11990,
    yearlyMonthlyPrice: 9592,
    features: ['Sınırsız temsilci', 'White-label', 'SLA %99.9', '7/24 öncelikli destek', 'Özel entegrasyon'],
    detailHref: '/contact?konu=kurumsal',
  },
]

export const ADDON_PRODUCTS: AddonProduct[] = [
  {
    slug: 'whatsapp-channel',
    name: 'WhatsApp Kanalı',
    description: 'WhatsApp Business mesajlarını birleşik gelen kutusuna aktarın.',
    monthlyPrice: 149,
    icon: '💬',
    category: 'Kanallar',
  },
  {
    slug: 'ai-sohbet-asistani',
    name: 'AI Asistan Pro',
    description: 'Gelişmiş bağlam analizi ve çok dilli otomatik yanıtlar.',
    monthlyPrice: 299,
    icon: '🤖',
    category: 'AI & Otomasyon',
  },
  {
    slug: 'white-label',
    name: 'Beyaz Etiket',
    description: 'Kendi markanız, alan adınız ve renklerinizle widget sunun.',
    monthlyPrice: 199,
    icon: '🏷️',
    category: 'Analitik & Marka',
  },
  {
    slug: 'advanced-analytics',
    name: 'Gelişmiş Analitik',
    description: 'Özel raporlar, CSV dışa aktarma ve API erişimi.',
    monthlyPrice: 79,
    icon: '📊',
    category: 'Analitik & Marka',
  },
  {
    slug: 'email-channel',
    name: 'E-posta Pro',
    description: 'Gelen kutusu senkronizasyonu ve otomatik yanıtlar.',
    monthlyPrice: 99,
    icon: '📧',
    category: 'Kanallar',
  },
  {
    slug: 'zapier-integration',
    name: 'Zapier Bağlantısı',
    description: '5000+ uygulamaya kodsuz entegrasyon.',
    monthlyPrice: 49,
    icon: '🔗',
    category: 'AI & Otomasyon',
  },
]

export function formatTry(amount: number): string {
  if (amount === 0) return 'Ücretsiz'
  return `₺${amount.toLocaleString('tr-TR')}`
}

export function subscriptionBuyHref(planId: PlanId, isLoggedIn = false): string {
  if (planId === 'FREE') return isLoggedIn ? '/dashboard' : '/register'
  if (planId === 'BUSINESS') return '/contact?konu=kurumsal'
  return isLoggedIn ? `/settings/billing?plan=${planId}` : `/register?plan=${planId}`
}

export function addonBuyHref(isLoggedIn = false): string {
  return isLoggedIn ? '/settings/addons' : '/register'
}
