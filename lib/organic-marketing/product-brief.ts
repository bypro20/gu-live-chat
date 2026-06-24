import { BLOG_POSTS } from '@/lib/blog-posts'
import { SITE_LEGAL } from '@/lib/site-legal'
import { trialFreeTierFaqLine } from '@/lib/trial-config'

const blogTopics = BLOG_POSTS.slice(0, 6).map((p) => `- ${p.title} (/blog/${p.slug})`).join('\n')

/** Gu Live Chat ürün özeti — AI strateji üretimi için sabit bağlam */
export function buildGuLiveChatProductBrief(): string {
  const base = SITE_LEGAL.url.replace(/\/$/, '')

  return `
Marka: ${SITE_LEGAL.name} (${base})
Slogan: ${SITE_LEGAL.tagline}
Pazar: Türkiye — e-ticaret, SaaS, ajanslar, KOBİ müşteri hizmetleri ekipleri
Dil: Türkçe (organik içerik); LinkedIn'de Türkçe + İngilizce karışık kabul edilebilir

Ürün özeti:
- Web sitesine 30 saniyede eklenen canlı sohbet widget'ı
- Birleşik inbox: widget, WhatsApp, Instagram DM, Telegram, e-posta
- AI chatbot (GPT/Gemini), bilgi bankası, hazır cevaplar
- Proaktif mesajlar, ziyaretçi takibi, ekran izleme (admin)
- CSAT, analitik, çoklu temsilci, rol yönetimi
- KVKK uyumu, iyzico ödeme, Türkçe arayüz — yerli alternatif

Fiyatlandırma (özet):
- Ücretsiz: 2 temsilci, temel widget — ${trialFreeTierFaqLine()}
- Başlangıç / Profesyonel / Kurumsal paketler — aylık abonelik
- Ana dönüşüm: ${base}/basla ve ${base}/register

Rakip konumlandırma:
- Zendesk/Intercom/Tidio yerine Türkçe destek, TL fiyat, hızlı kurulum
- WhatsApp + live chat tek panelde — e-ticaret için güçlü argüman

Mevcut blog içerikleri:
${blogTopics}

Organik kanallar (öncelik sırası):
1. Blog SEO — uzun kuyruk anahtar kelimeler, Search Console
2. LinkedIn — B2B karar vericiler (e-ticaret müdürü, CX, operasyon)
3. Instagram — kısa demo videoları, widget kurulum, before/after
4. TikTok — 15-30 sn "canlı destek kurulumu" trend içerikleri
5. X — ipuçları, ürün güncellemeleri, müşteri hizmetleri thread'leri

UTM şablonu: utm_source={kanal}&utm_medium=organic&utm_campaign={kampanya}
`.trim()
}
