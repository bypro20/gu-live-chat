import type { SiteLocale } from './regional-config'
import { formatPlanCount } from './plan-i18n'

type FeatureValue = boolean | string | null

export type PricingFeatureRow = {
  label: string
  tooltip?: string
  free: FeatureValue
  starter: FeatureValue
  pro: FeatureValue
  business: FeatureValue
}

export type PricingFeatureGroup = {
  group: string
  rows: PricingFeatureRow[]
}

export type PricingPageUi = {
  heroTitle: string
  heroSubtitle: string
  monthly: string
  yearly: string
  yearlyDiscount: string
  free: string
  forever: string
  perMonth: string
  yearlyNote: (total: string) => string
  perWorkspace: string
  noCard: string
  flatTitle: string
  flatDesc: string
  startFree: string
  compareTitle: string
  compareSubtitle: string
  featureCol: string
  faqTitle: string
  bestValue: string
}

export function getPricingPageUi(locale: SiteLocale): PricingPageUi {
  if (locale === 'en') {
    return {
      heroTitle: 'Simple, transparent pricing',
      heroSubtitle: 'Flat price per workspace, not per agent. Costs stay predictable as your team grows.',
      monthly: 'Monthly',
      yearly: 'Yearly',
      yearlyDiscount: '20% off',
      free: 'Free',
      forever: 'Forever',
      perMonth: '/mo',
      yearlyNote: (total) => `Yearly ${total} · 20% off`,
      perWorkspace: 'Per workspace',
      noCard: 'No credit card required · Cancel anytime',
      flatTitle: 'Flat workspace pricing — not per agent',
      flatDesc: 'Add as many agents as you need without raising your monthly bill. Focus on growth, not seat math.',
      startFree: 'Start Free',
      compareTitle: 'Compare plans',
      compareSubtitle: 'Choose the plan that fits your company.',
      featureCol: 'Feature',
      faqTitle: 'Pricing FAQ',
      bestValue: 'Best value',
    }
  }
  return {
    heroTitle: 'Basit, şeffaf fiyatlandırma',
    heroSubtitle: 'Temsilci başına değil, çalışma alanı başına sabit fiyat. Ekibiniz büyüdükçe maliyet artmaz.',
    monthly: 'Aylık',
    yearly: 'Yıllık',
    yearlyDiscount: '%20 indirim',
    free: 'Ücretsiz',
    forever: 'Sonsuza dek',
    perMonth: '/ay',
    yearlyNote: (total) => `Yıllık ${total} · %20 indirimli`,
    perWorkspace: 'Çalışma alanı başına',
    noCard: 'Kredi kartı gerekmez · İstediğinde iptal',
    flatTitle: 'Temsilci başına değil, çalışma alanı başına sabit fiyat',
    flatDesc: 'Ekibinize kaç kişi eklerseniz ekleyin, aylık ücretiniz değişmez. Büyürken ekstra maliyet endişesi taşımadan işinize odaklanın.',
    startFree: 'Ücretsiz Başla',
    compareTitle: 'Planları karşılaştırın',
    compareSubtitle: 'Şirketinize en uygun planı seçin.',
    featureCol: 'Özellik',
    faqTitle: 'Fiyatlandırma SSS',
    bestValue: 'En İyi Değer',
  }
}

export function getPricingFaqs(locale: SiteLocale): { q: string; a: string }[] {
  if (locale === 'en') {
    return [
      {
        q: 'Do I pay extra for included features?',
        a: 'All features in your plan are included in the monthly price. Only special integrations or extra agent licenses may incur additional fees.',
      },
      {
        q: 'Is VAT included in prices?',
        a: 'Displayed prices exclude VAT. Applicable VAT is added at checkout. Business customers should consult their accounting team for VAT recovery.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes — start on the free plan or try PRO features with a 7-day trial after signup. No credit card required to begin.',
      },
      {
        q: 'Can I change plans anytime?',
        a: 'Yes. Upgrade or downgrade whenever you want. Upgrades are prorated for the remaining period. Your data is never deleted.',
      },
      {
        q: 'How much do I save with yearly billing?',
        a: 'Yearly billing gives you 20% off. Pay the annual amount upfront and enjoy the discounted rate.',
      },
      {
        q: 'How do I get an enterprise quote?',
        a: 'Contact us via the form. Our team will respond quickly with custom integration, white-label, SLA, and pricing options.',
      },
    ]
  }
  return [
    {
      q: 'Bazı özellikler için ekstra ücret öder miyim?',
      a: 'Planınıza dahil olan tüm özellikler aylık fiyata dahildir. Sadece belirli özel entegrasyonlar veya ek temsilci lisansları için ek ücret söz konusu olabilir.',
    },
    {
      q: 'Fiyatlara KDV dahil mi?',
      a: 'Gösterilen fiyatlar KDV hariçtir. Fatura aşamasında geçerli KDV oranı (%20) eklenecektir. Kurumsal mükelleflerin KDV iade süreci için muhasebe ekibinize danışabilirsiniz.',
    },
    {
      q: 'Ücretsiz deneme var mı?',
      a: 'Evet — ücretsiz paketle başlayın veya kayıt sonrası 7 günlük PRO denemesi kullanın. Başlamak için kredi kartı gerekmez.',
    },
    {
      q: 'İstediğim zaman plan değiştirebilir miyim?',
      a: 'Evet, istediğiniz an yükseltme veya düşürme yapabilirsiniz. Yükseltmelerde kalan süre için kıst hesaplama yapılır. Verileriniz hiçbir zaman silinmez.',
    },
    {
      q: 'Yıllık ödeme yaparsam ne kadar tasarruf ederim?',
      a: 'Yıllık ödeme seçeneğinde %20 indirim uygulanır. Seçtiğiniz planın yıllık tutarını peşin ödeyerek avantajlı fiyattan yararlanabilirsiniz.',
    },
    {
      q: 'Kurumsal plan için nasıl teklif alabilirim?',
      a: 'İletişim formumuzdan bize ulaşın. Özel entegrasyon, white-label, özel SLA ve özel fiyatlandırma için ekibimiz en kısa sürede dönüş yapar.',
    },
  ]
}

export function getPricingFeatureGroups(
  locale: SiteLocale,
  prices: { free: string; starter: string; pro: string; business: string }
): PricingFeatureGroup[] {
  const unlimited = formatPlanCount(Infinity, locale)
  const en = locale === 'en'

  return [
    {
      group: en ? 'Pricing' : 'Fiyatlandırma',
      rows: [
        { label: en ? 'Monthly price' : 'Aylık fiyat', free: prices.free, starter: prices.starter, pro: prices.pro, business: prices.business },
        { label: en ? 'Included agents' : 'Dahil temsilci', free: '2', starter: '5', pro: '25', business: unlimited },
        { label: en ? 'Monthly chat limit' : 'Aylık sohbet limiti', free: '100', starter: '1.000', pro: unlimited, business: unlimited },
      ],
    },
    {
      group: en ? 'Team Inbox' : 'Ekip Gelen Kutusu',
      rows: [
        { label: en ? 'Live chat widget' : "Canlı sohbet widget'ı", free: true, starter: true, pro: true, business: true },
        { label: en ? 'Shared inbox' : 'Paylaşımlı gelen kutusu', free: true, starter: true, pro: true, business: true },
        { label: en ? 'Mobile app' : 'Mobil uygulama', free: true, starter: true, pro: true, business: true },
        { label: en ? 'Unlimited chat history' : 'Sınırsız sohbet geçmişi', free: false, starter: true, pro: true, business: true },
        { label: en ? 'Canned replies' : 'Hazır cevaplar', free: false, starter: true, pro: true, business: true },
        { label: en ? 'Ticketing system' : 'Bilet sistemi', free: false, starter: true, pro: true, business: true },
        { label: en ? 'CSAT ratings' : 'CSAT puanlama', free: false, starter: true, pro: true, business: true },
      ],
    },
    {
      group: en ? 'Channels' : 'Kanallar',
      rows: [
        { label: en ? 'Website widget' : "Web sitesi widget'ı", free: true, starter: true, pro: true, business: true },
        { label: 'Email', free: false, starter: true, pro: true, business: true },
        { label: 'WhatsApp Business', free: false, starter: false, pro: true, business: true },
        { label: 'Messenger', free: false, starter: false, pro: true, business: true },
        { label: 'Instagram DM', free: false, starter: false, pro: true, business: true },
        { label: 'Telegram', free: false, starter: false, pro: true, business: true },
      ],
    },
    {
      group: en ? 'Artificial Intelligence' : 'Yapay Zeka',
      rows: [
        { label: en ? 'AI auto-reply' : 'AI otomatik yanıt', free: false, starter: false, pro: true, business: true },
        { label: en ? 'AI agent assistant' : 'AI temsilci asistanı', free: false, starter: false, pro: true, business: true },
        { label: en ? '50+ language auto-translate' : '50+ dil otomatik çeviri', free: false, starter: false, pro: true, business: true },
        { label: en ? 'Knowledge base AI training' : 'Bilgi bankası AI eğitimi', free: false, starter: true, pro: true, business: true },
      ],
    },
    {
      group: en ? 'Security & SLA' : 'Güvenlik & SLA',
      rows: [
        { label: en ? 'SSL/TLS encryption' : 'SSL/TLS şifreleme', free: true, starter: true, pro: true, business: true },
        { label: en ? '2FA' : '2 Faktörlü doğrulama', free: true, starter: true, pro: true, business: true },
        { label: en ? 'GDPR / privacy compliance' : 'KVKK uyumu', free: true, starter: true, pro: true, business: true },
        { label: en ? 'Custom SLA guarantee' : 'Özel SLA garantisi', free: false, starter: false, pro: false, business: true },
        { label: en ? '24/7 priority support' : '7/24 öncelikli destek', free: false, starter: false, pro: false, business: true },
      ],
    },
  ]
}

export const PRICING_PLAN_META = [
  { id: 'FREE' as const, highlighted: false, badge: null as string | null },
  { id: 'STARTER' as const, highlighted: false, badge: null as string | null },
  { id: 'PRO' as const, highlighted: true, badge: 'bestValue' as const },
  { id: 'BUSINESS' as const, highlighted: false, badge: null as string | null },
]
