import { MARKETING_CAMPAIGN_LINKS } from '@/lib/marketing-campaigns'
import { SITE_LEGAL } from '@/lib/site-legal'
import type { AdCampaignTask, PaidChannel, PaidMarketingPlan } from './types'

const BASE = SITE_LEGAL.url.replace(/\/$/, '')

function id(prefix: string, n: number) {
  return `${prefix}-${n}`
}

function linkUrl(campaignId: string) {
  return MARKETING_CAMPAIGN_LINKS.find((l) => l.id === campaignId)?.url ?? `${BASE}/basla`
}

function datesFromToday(count: number) {
  const out: string[] = []
  const d = new Date()
  for (let i = 0; i < count; i++) {
    const x = new Date(d)
    x.setDate(d.getDate() + i)
    out.push(x.toISOString().slice(0, 10))
  }
  return out
}

export function buildSeedPaidPlan(): PaidMarketingPlan {
  const audiences = [
    {
      id: id('pa', 1),
      name: 'E-ticaret & D2C',
      description: 'Shopify, WooCommerce, Trendyol mağazaları — sepet terk ve WhatsApp yoğunluğu.',
      channels: ['google_search', 'meta_feed', 'meta_retarget'] as PaidChannel[],
      interests: ['E-ticaret', 'Online alışveriş', 'Shopify', 'WooCommerce', 'Dropshipping'],
      jobTitles: ['E-ticaret Müdürü', 'Mağaza Sahibi', 'Dijital Pazarlama Uzmanı'],
      locations: ['Türkiye'],
    },
    {
      id: id('pa', 2),
      name: 'KOBİ Müşteri Hizmetleri',
      description: '5–50 kişilik ekipler; telefon/e-posta yerine canlı sohbet arayan yerel işletmeler.',
      channels: ['google_search', 'meta_feed'] as PaidChannel[],
      interests: ['Küçük işletme', 'Girişimcilik', 'Müşteri hizmetleri'],
      jobTitles: ['İşletme Sahibi', 'Operasyon Müdürü', 'Müşteri İlişkileri'],
      locations: ['Türkiye', 'İstanbul', 'Ankara', 'İzmir'],
    },
    {
      id: id('pa', 3),
      name: 'Dijital Ajanslar',
      description: 'Müşterilerine canlı destek kurulumu sunan ajanslar ve freelancerlar.',
      channels: ['linkedin', 'google_search'] as PaidChannel[],
      interests: ['Dijital ajans', 'Web tasarım', 'Pazarlama ajansı'],
      jobTitles: ['Ajans Sahibi', 'Proje Yöneticisi', 'Freelancer'],
      locations: ['Türkiye'],
    },
    {
      id: id('pa', 4),
      name: 'SaaS & B2B',
      description: 'Trial dönüşümü ve destek maliyetini düşürmek isteyen yazılım ekipleri.',
      channels: ['linkedin', 'google_search'] as PaidChannel[],
      interests: ['SaaS', 'B2B yazılım', 'Startup'],
      jobTitles: ['Ürün Müdürü', 'Müşteri Başarısı', 'CTO'],
      locations: ['Türkiye'],
    },
  ]

  const campaigns = [
    {
      id: id('pc', 1),
      audienceId: id('pa', 1),
      name: 'Google Search — Canlı Destek (Ana)',
      channel: 'google_search' as const,
      objective: 'Kayıt / deneme başlatma',
      dailyBudgetTry: 150,
      landingPath: '/basla',
      utmCampaign: 'search-canli-destek',
    },
    {
      id: id('pc', 2),
      audienceId: id('pa', 2),
      name: 'Google Search — Chatbot + Destek',
      channel: 'google_search' as const,
      objective: 'Ücretsiz kayıt',
      dailyBudgetTry: 100,
      landingPath: '/register?plan=PRO',
      utmCampaign: 'search-pro-trial',
    },
    {
      id: id('pc', 3),
      audienceId: id('pa', 1),
      name: 'Meta Feed — E-ticaret farkındalık',
      channel: 'meta_feed' as const,
      objective: 'Trafik + video izleme',
      dailyBudgetTry: 80,
      landingPath: '/canli-destek',
      utmCampaign: 'pro-awareness',
    },
    {
      id: id('pc', 4),
      audienceId: id('pa', 1),
      name: 'Meta Retarget — Site ziyaretçisi',
      channel: 'meta_retarget' as const,
      objective: 'Kayıt tamamlama',
      dailyBudgetTry: 60,
      landingPath: '/pricing',
      utmCampaign: 'visited-no-signup',
    },
    {
      id: id('pc', 5),
      audienceId: id('pa', 3),
      name: 'LinkedIn — B2B demo',
      channel: 'linkedin' as const,
      objective: 'Demo talebi',
      dailyBudgetTry: 120,
      landingPath: '/contact?konu=demo',
      utmCampaign: 'b2b-demo',
    },
  ]

  const taskTemplates: Omit<AdCampaignTask, 'id' | 'date'>[] = [
    {
      channel: 'google_search',
      audienceId: id('pa', 1),
      campaignName: 'Search — Canlı destek yazılımı',
      objective: 'Kayıt',
      dailyBudgetTry: 150,
      landingUrl: linkUrl('google-search-primary'),
      creative: {
        headlines: [
          'Canlı Destek Yazılımı',
          '14 Gün Ücretsiz PRO',
          'WhatsApp + Sohbet Tek Panel',
          '30 Saniyede Kurulum',
        ],
        descriptions: [
          'Gu Live Chat ile web sitenize canlı sohbet ekleyin. KVKK uyumlu, iyzico güvenli ödeme. Hemen deneyin.',
          'E-ticaret sitenizde anında yanıt verin. AI chatbot + birleşik gelen kutusu. Kredi kartı gerekmez.',
          'Türk yapımı canlı destek platformu. WhatsApp, web sohbet ve e-posta tek panelde.',
        ],
        callToAction: 'Ücretsiz Başla',
      },
      keywords: {
        matchType: 'phrase',
        keywords: [
          'canlı destek yazılımı',
          'live chat türkiye',
          'web sitesi canlı sohbet',
          'chatbot yazılımı',
          'whatsapp destek sistemi',
          'müşteri destek yazılımı',
        ],
        negativeKeywords: ['ücretsiz indir', 'iş ilanı', 'kurs', 'eğitim'],
      },
      targetingNotes: 'Konum: Türkiye · Dil: Türkçe · Ağ: Arama',
      status: 'ready',
      tip: 'Google Ads → Yeni kampanya → Arama → Bu başlık/açıklamaları yapıştırın',
    },
    {
      channel: 'meta_feed',
      audienceId: id('pa', 1),
      campaignName: 'Meta — E-ticaret sahipleri',
      objective: 'Trafik',
      dailyBudgetTry: 80,
      landingUrl: linkUrl('meta-ig-pro'),
      creative: {
        headlines: ['Sepet Terk Oranını Düşürün'],
        descriptions: [],
        primaryText:
          'Müşteri sitenizde takıldığında anında yanıt verin 🚀\n\nGu Live Chat: canlı sohbet + WhatsApp + AI chatbot tek panelde.\n✅ 14 gün ücretsiz PRO\n✅ 30 saniyede kurulum\n✅ KVKK uyumlu\n\nHemen deneyin →',
        callToAction: 'Kayıt Ol',
      },
      targetingNotes: 'İlgi: E-ticaret, Shopify, online mağaza · Yaş: 25–54 · Türkiye',
      status: 'ready',
      tip: '15 sn ekran kaydı videosu + bu metin en iyi sonucu verir',
    },
    {
      channel: 'meta_retarget',
      audienceId: id('pa', 1),
      campaignName: 'Meta Retarget — Kayıt tamamla',
      objective: 'Dönüşüm',
      dailyBudgetTry: 60,
      landingUrl: linkUrl('meta-retarget'),
      creative: {
        headlines: ['Hâlâ Kararsız mısınız?'],
        descriptions: [],
        primaryText:
          'Gu Live Chat\'i 14 gün ücretsiz denediniz mi?\n\nKredi kartı gerekmez · Kurulum 30 saniye · İstediğiniz zaman iptal.\n\nBinlerce işletme müşterilerine anında yanıt veriyor.',
        callToAction: 'Ücretsiz Başla',
      },
      targetingNotes: 'Özel kitle: Son 30 gün site ziyaretçisi, kayıt olmayanlar (Pixel gerekli)',
      status: 'ready',
      tip: 'Pixel kurulu olmalı — Events Manager\'da PageView + Lead kontrol edin',
    },
    {
      channel: 'linkedin',
      audienceId: id('pa', 3),
      campaignName: 'LinkedIn — B2B demo',
      objective: 'Lead',
      dailyBudgetTry: 120,
      landingUrl: linkUrl('linkedin-b2b'),
      creative: {
        headlines: [
          'Müşteri Desteğini Tek Panelde Yönetin',
          'Canlı Sohbet + WhatsApp + AI',
        ],
        descriptions: [
          'Gu Live Chat ile ekibiniz tüm kanallardan gelen mesajlara tek yerden yanıt verir. Demo talep edin.',
        ],
        primaryText:
          'E-ticaret ve SaaS ekipleri için Türk yapımı canlı destek platformu.\n\n• Birleşik gelen kutusu\n• AI chatbot (GPT/Gemini)\n• KVKK uyumlu, iyzico ödeme\n\n14 gün ücretsiz PRO denemesi.',
        callToAction: 'Demo Talep Et',
      },
      targetingNotes: 'Unvan: E-ticaret Müdürü, Müşteri Hizmetleri, Operasyon · Şirket: 11–200 çalışan',
      status: 'ready',
      tip: 'Hafta içi 09:00–18:00 yayın saati önerilir',
    },
    {
      channel: 'google_search',
      audienceId: id('pa', 2),
      campaignName: 'Search — Rakip alternatif',
      objective: 'Kayıt',
      dailyBudgetTry: 100,
      landingUrl: linkUrl('google-search-pro'),
      creative: {
        headlines: [
          'Tidio Alternatifi Türkiye',
          'Yerli Canlı Destek',
          'KVKK Uyumlu Live Chat',
        ],
        descriptions: [
          'Türkçe panel, iyzico ödeme, WhatsApp entegrasyonu. Gu Live Chat ile hemen başlayın.',
          'Yabancı araçlara alternatif: yerli canlı destek + AI chatbot. 14 gün ücretsiz.',
        ],
        callToAction: 'Ücretsiz Dene',
      },
      keywords: {
        matchType: 'phrase',
        keywords: [
          'tidio alternatif',
          'jivochat alternatif',
          'zendesk alternatif türkiye',
          'canlı destek fiyat',
        ],
        negativeKeywords: ['crack', 'nulled', 'bedava script'],
      },
      targetingNotes: 'Konum: Türkiye · Rakip marka + genel anahtar kelimeler',
      status: 'ready',
      tip: 'Rakip marka kelimelerinde dikkatli olun — marka politikasına uygun metin kullanın',
    },
  ]

  const dates = datesFromToday(7)
  const calendar: AdCampaignTask[] = dates.flatMap((date, dayIndex) => {
    const template = taskTemplates[dayIndex % taskTemplates.length]!
    return [
      {
        ...template,
        id: `ad-${date}-${template.channel}`,
        date,
      },
    ]
  })

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    audiences,
    campaigns,
    calendar,
  }
}
