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
    features: ['2 temsilci', '300 sohbet/ay', 'Canlı sohbet widget', 'E-posta bildirimleri', 'Temel analitik'],
    detailHref: '/canli-destek',
  },
  {
    id: 'STARTER',
    name: 'Başlangıç Paketi',
    description: 'Büyüyen işletmeler için aylık dijital abonelik — ziyaretçi takibi ve bilgi bankası.',
    monthlyPrice: 490,
    yearlyMonthlyPrice: 392,
    features: [
      '5 temsilci',
      '1.000 sohbet/ay',
      'Ziyaretçi takibi & bilgi bankası',
      'Bilet sistemi & hazır cevaplar',
      'AI/RAG/kanal eklentileri ayrı satın alınabilir',
    ],
    detailHref: '/canli-destek',
  },
  {
    id: 'PRO',
    name: 'Profesyonel Paket',
    description: 'Tam özellikli canlı destek platformu — AI, chatbot ve çoklu kanal dahil.',
    monthlyPrice: 990,
    yearlyMonthlyPrice: 792,
    badge: 'En çok tercih edilen',
    highlighted: true,
    features: [
      '25 temsilci',
      'Sınırsız sohbet',
      'AI + RAG + Copilot + Sesli AI',
      'WhatsApp, SMS, LinkedIn & tüm kanallar',
      'AI analitik & akıllı yönlendirme',
    ],
    detailHref: '/chatbot',
  },
  {
    id: 'BUSINESS',
    name: 'Kurumsal Paket',
    description: 'White-label, SLA ve özel entegrasyon içeren kurumsal dijital abonelik.',
    monthlyPrice: 2490,
    yearlyMonthlyPrice: 1992,
    features: [
      'Sınırsız temsilci & sohbet',
      'Profesyonel AI platformu dahil',
      'White-label & SLA %99.9',
      '7/24 öncelikli destek',
      'Özel entegrasyon',
    ],
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
  {
    slug: 'ai-rag-pro',
    name: 'AI Bilgi Eğitimi (RAG)',
    description: 'PDF, URL ve metin ile semantik bilgi bankası eğitimi.',
    monthlyPrice: 199,
    icon: '📚',
    category: 'AI & Otomasyon',
  },
  {
    slug: 'ai-copilot',
    name: 'AI Copilot',
    description: 'Inbox\'ta yanıt önerisi, kısaltma ve çeviri.',
    monthlyPrice: 199,
    icon: '✨',
    category: 'AI & Otomasyon',
  },
  {
    slug: 'voice-ai-agent',
    name: 'Sesli AI Asistan',
    description: 'Tarayıcıda konuşmalı AI — RAG ve web araması destekli.',
    monthlyPrice: 249,
    icon: '🎙️',
    category: 'AI & Otomasyon',
  },
  {
    slug: 'linkedin-channel',
    name: 'LinkedIn Kanalı',
    description: 'LinkedIn mesajlarını birleşik inbox\'ta yönetin.',
    monthlyPrice: 149,
    icon: '💼',
    category: 'Kanallar',
  },
  {
    slug: 'sms-channel',
    name: 'Twilio SMS',
    description: 'İki yönlü SMS — gelen kutusunda yanıtlayın.',
    monthlyPrice: 99,
    icon: '📱',
    category: 'Kanallar',
  },
]

export function formatTry(amount: number): string {
  if (amount === 0) return 'Ücretsiz'
  return `₺${amount.toLocaleString('tr-TR')}`
}

export function subscriptionBuyHref(planId: PlanId, isLoggedIn = false): string {
  if (planId === 'FREE') return isLoggedIn ? '/dashboard' : '/register'
  if (planId === 'BUSINESS') return '/contact?konu=kurumsal'
  return isLoggedIn ? `/settings/plans?plan=${planId}` : `/register?plan=${planId}`
}

export function addonBuyHref(isLoggedIn = false): string {
  return isLoggedIn ? '/settings/addons' : '/register'
}
