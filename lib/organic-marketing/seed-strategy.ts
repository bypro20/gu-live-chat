import { buildGuLiveChatProductBrief } from './product-brief'
import type { OrganicMarketingPlan } from './types'

const BASE = 'https://www.gulivechat.com'

function id(prefix: string, n: number) {
  return `${prefix}-${n}`
}

/** AI yokken veya hata durumunda kullanılan hazır strateji */
export function buildSeedOrganicPlan(): OrganicMarketingPlan {
  const audiences = [
    {
      id: id('aud', 1),
      name: 'E-ticaret & D2C Markalar',
      description:
        'Shopify, WooCommerce, Trendyol mağazası olan, sepet terk ve WhatsApp destek yükü yaşayan markalar.',
      painPoints: [
        'Sepet terk oranı yüksek, anında yanıt yok',
        'WhatsApp ve site mesajları dağınık',
        'Gece/hafta sonu destek boşluğu',
      ],
      channels: ['blog', 'instagram', 'linkedin'] as const,
      keywords: ['e-ticaret canlı destek', 'sepet terk azaltma', 'whatsapp müşteri hizmetleri'],
    },
    {
      id: id('aud', 2),
      name: 'Dijital Ajanslar & Freelancer',
      description:
        'Müşterilerine canlı destek/chatbot kurulumu sunan ajanslar; white-label ve hızlı devreye alma arar.',
      painPoints: [
        'Her müşteri için ayrı araç maliyeti',
        'Kurulum süresi uzun, destek yükü',
        'Raporlama ve SLA takibi zor',
      ],
      channels: ['linkedin', 'blog', 'x'] as const,
      keywords: ['canlı destek ajans', 'chatbot kurulum', 'müşteri sitesi widget'],
    },
    {
      id: id('aud', 3),
      name: 'SaaS & B2B Yazılım',
      description: 'Deneme kullanıcılarını aktive etmek, onboarding ve destek maliyetini düşürmek isteyen SaaS ekipleri.',
      painPoints: [
        'Trial → paid dönüşüm düşük',
        'Tekrarlayan destek talepleri',
        'Çok dilli kullanıcı desteği',
      ],
      channels: ['linkedin', 'blog', 'tiktok'] as const,
      keywords: ['saas canlı chat', 'trial dönüşüm', 'ai müşteri desteği'],
    },
    {
      id: id('aud', 4),
      name: 'KOBİ Müşteri Hizmetleri',
      description: '5–20 kişilik ekipler; telefon/e-posta yoğun, chat\'e geçmek isteyen yerel işletmeler.',
      painPoints: [
        'Telefon kuyruğu, kaçan müşteriler',
        'E-posta yanıt süresi uzun',
        'Bütçe kısıtlı, kurulum karmaşık görünüyor',
      ],
      channels: ['instagram', 'blog', 'linkedin'] as const,
      keywords: ['canlı destek yazılımı', 'müşteri hizmetleri yazılımı', 'ücretsiz live chat'],
    },
  ]

  const strategies = [
    {
      id: id('str', 1),
      audienceId: id('aud', 1),
      title: 'Sepet kurtarma + WhatsApp birleşik inbox',
      tactics: [
        'Checkout sayfasında proaktif mesaj senaryosu demo videosu (Reels/TikTok)',
        'Blog: sepet terk istatistikleri + canlı destek case study',
        'LinkedIn carousel: "3 mesaj = %20 daha az sepet terk" formatı',
        'Trendyol/Shopify gruplarında organik ipucu paylaşımı (spam değil, değer)',
      ],
      contentIdeas: [
        '30 saniyede widget kurulumu',
        'WhatsApp + site chat tek panelde',
        'Gece chatbot, gündüz insan desteği akışı',
      ],
      postingFrequency: 'Blog 1/hafta · Instagram 3/hafta · LinkedIn 2/hafta',
      kpis: ['Kayıt (register)', 'Demo talebi', 'Blog organik trafik'],
    },
    {
      id: id('str', 2),
      audienceId: id('aud', 2),
      title: 'Ajans partner programı + hızlı kurulum içeriği',
      tactics: [
        'LinkedIn: "Müşterinize 1 günde canlı destek" teknik thread',
        'Blog: çoklu site yönetimi, widget embed rehberi',
        'Referans UTM linkleri ile partner takibi',
        'Ayda 1 canlı webinar / LinkedIn Live (widget kurulum)',
      ],
      contentIdeas: [
        'Ajans için 5 müşteriyi tek panelden yönetme',
        'White-label marka ayarları',
        'Chatbot şablonları ile teslim süresini kısaltma',
      ],
      postingFrequency: 'LinkedIn 3/hafta · Blog 2/ay · X 2/hafta',
      kpis: ['Partner kayıt', 'ref= UTM kayıtları', 'İletişim formu demo'],
    },
    {
      id: id('str', 3),
      audienceId: id('aud', 3),
      title: 'Trial aktivasyonu + AI destek maliyeti',
      tactics: [
        'LinkedIn thought leadership: AI + insan hibrit destek',
        'Blog: SaaS onboarding chatbot akışları',
        'TikTok: "Destek ekibiniz uyurken chatbot çalışsın" kısa format',
        'Product Hunt / Indie Hackers TR topluluklarında case paylaşımı',
      ],
      contentIdeas: [
        'Trial kullanıcısına proaktif karşılama',
        'Bilgi bankası + GPT entegrasyonu demo',
        'CSAT ile destek kalitesi ölçümü',
      ],
      postingFrequency: 'LinkedIn 2/hafta · Blog 1/hafta · TikTok 2/hafta',
      kpis: ['Trial başlatma', 'Pro plan upgrade', 'Blog time-on-page'],
    },
    {
      id: id('str', 4),
      audienceId: id('aud', 4),
      title: 'Ücretsiz başlangıç + güven içeriği',
      tactics: [
        'Instagram: "Kredi kartı yok, 2 dakikada kurulum" Reels',
        'Blog: KVKK, güvenlik, iyzico ödeme güveni',
        'Google Business / yerel KOBİ gruplarında SSS paylaşımı',
        'Müşteri hikayesi formatında kısa testimonial (izinli)',
      ],
      contentIdeas: [
        'Ücretsiz paket limitleri şeffaf anlatım',
        'Telefon yerine chat\'e geçiş rehberi',
        'Hazır cevaplar ile ekip verimliliği',
      ],
      postingFrequency: 'Instagram 4/hafta · Blog 1/hafta · LinkedIn 1/hafta',
      kpis: ['Ücretsiz kayıt', 'Aktif widget kurulumu', 'Search Console tıklama'],
    },
  ]

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: 'seed',
    productBrief: buildGuLiveChatProductBrief(),
    audiences: audiences.map((a) => ({ ...a, channels: [...a.channels] })),
    strategies,
    calendar: buildSeedWeekCalendar(
      audiences.map((a) => ({ ...a, channels: [...a.channels] })),
      strategies
    ),
  }
}

function buildSeedWeekCalendar(
  audiences: OrganicMarketingPlan['audiences'],
  strategies: OrganicMarketingPlan['strategies']
) {
  const today = new Date()
  const tasks: OrganicMarketingPlan['calendar'] = []
  const templates = [
    {
      channel: 'blog' as const,
      type: 'article' as const,
      title: 'E-ticarette Canlı Destek ile Sepet Terk Oranını Düşürün',
      hook: 'Müşteriniz ödeme sayfasında takıldığında 60 saniye içinde yanıt verin.',
      body: 'Araştırmalar, anında destek sunan e-ticaret sitelerinde dönüşümün %15–40 arttığını gösteriyor. Gu Live Chat ile checkout sayfasında proaktif mesaj kurun, WhatsApp mesajlarını aynı inbox\'ta yönetin.',
      cta: 'Ücretsiz deneyin — 30 saniyede kurulum',
      landingUrl: `${BASE}/basla?utm_source=blog&utm_medium=organic&utm_campaign=sepet-terk`,
      audienceId: audiences[0]?.id,
    },
    {
      channel: 'instagram' as const,
      type: 'reel' as const,
      title: 'Widget kurulumu 30 saniye',
      hook: 'Tek satır kod → canlı sohbet aktif ⚡',
      body: 'Ekran kaydı: kopyala → yapıştır → widget canlı. Yorumlara DEMO yazın.',
      cta: 'Link bio\'da — gulivechat.com/basla',
      hashtags: ['canlıdestek', 'eticaret', 'shopify', 'woocommerce', 'gulivechat'],
      audienceId: audiences[0]?.id,
    },
    {
      channel: 'linkedin' as const,
      type: 'carousel' as const,
      title: '5 işaret: Canlı destek yazılımına ihtiyacınız var',
      hook: 'Destek ekibiniz e-posta kuyruğunda boğuluyorsa bu slayt sizin için.',
      body: '1) Yanıt süresi >5 dk 2) WhatsApp dağınık 3) Gece talepler kaçıyor 4) Tekrarlayan sorular 5) Sepet terk yüksek → Tek inbox + AI chatbot çözümü.',
      cta: 'Demo için mesaj atın veya gulivechat.com/contact',
      landingUrl: `${BASE}/contact?utm_source=linkedin&utm_medium=organic&utm_campaign=b2b-demo`,
      audienceId: audiences[1]?.id,
    },
    {
      channel: 'tiktok' as const,
      type: 'reel' as const,
      title: 'Chatbot gece çalışsın',
      hook: 'Müşteriniz saat 23:00\'de yazdı — siz uyuyorsunuz.',
      body: 'AI chatbot SSS yanıtlar, sabah inbox\'ta özet. Gu Live Chat ücretsiz paketle dene.',
      cta: 'gulivechat.com — link profilde',
      hashtags: ['chatbot', 'müşterihizmetleri', 'saas', 'startup'],
      audienceId: audiences[2]?.id,
    },
    {
      channel: 'x' as const,
      type: 'post' as const,
      title: 'Canlı destek ipucu',
      hook: 'Proaktif mesaj ≠ spam.',
      body: 'Doğru sayfada (fiyat, checkout, iade) doğru zamanda teklif edilen yardım dönüşümü artırır. Sepet terk sayfasında 45 sn sonra "Yardımcı olabilir miyiz?" test edin.',
      cta: 'gulivechat.com/basla',
      audienceId: audiences[3]?.id,
    },
    {
      channel: 'blog' as const,
      type: 'article' as const,
      title: 'Ajanslar İçin Çoklu Site Canlı Destek Yönetimi',
      hook: '5 müşteri sitesi, tek panel.',
      body: strategies[1]?.tactics[0] ?? 'Ajanslar için çoklu site yönetimi rehberi.',
      cta: 'Partner olun — gulivechat.com/register',
      landingUrl: `${BASE}/register?utm_source=blog&utm_medium=organic&utm_campaign=ajans`,
      audienceId: audiences[1]?.id,
    },
    {
      channel: 'linkedin' as const,
      type: 'post' as const,
      title: 'Yerli canlı destek alternatifi',
      hook: 'TL fiyat, Türkçe destek, KVKK uyumu — neden yerli SaaS?',
      body: 'Gu Live Chat: iyzico ödeme, Türkçe arayüz, WhatsApp + widget birleşik inbox. Zendesk fiyatına alternatif arayan ekipler için.',
      cta: 'Detay: gulivechat.com/urunler',
      landingUrl: `${BASE}/urunler?utm_source=linkedin&utm_medium=organic&utm_campaign=product`,
      audienceId: audiences[3]?.id,
    },
  ]

  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const tpl = templates[i % templates.length]
    if (!tpl) continue

    tasks.push({
      id: `task-seed-${i + 1}`,
      date: d.toISOString().slice(0, 10),
      channel: tpl.channel,
      type: tpl.type,
      title: tpl.title,
      hook: tpl.hook,
      body: tpl.body,
      cta: tpl.cta,
      hashtags: tpl.hashtags,
      landingUrl: tpl.landingUrl,
      status: 'draft',
      audienceId: tpl.audienceId,
      generatedAt: new Date().toISOString(),
    })
  }

  return tasks
}
