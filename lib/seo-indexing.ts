import { SITE_URL } from '@/lib/seo'

/** IndexNow anahtarı — public/{key}.txt dosyasında barındırılır */
export const INDEXNOW_KEY = '7f3a9b2e1d4c8f6a5b0e3d2c1b4a5f6'

export const SITEMAP_URL = `${SITE_URL}/sitemap.xml`

/** Google/Bing indeksleme için öncelikli sayfalar — gulivechat.com */
export const PRIORITY_URLS = [
  SITE_URL,
  `${SITE_URL}/canli-destek`,
  `${SITE_URL}/chatbot`,
  `${SITE_URL}/whatsapp-destek`,
  `${SITE_URL}/pricing`,
  `${SITE_URL}/urunler`,
  `${SITE_URL}/features`,
  `${SITE_URL}/ai`,
  `${SITE_URL}/integrations`,
  `${SITE_URL}/demo`,
  `${SITE_URL}/register`,
  `${SITE_URL}/mobil-indir`,
  `${SITE_URL}/help`,
  `${SITE_URL}/contact`,
  `${SITE_URL}/blog`,
  `${SITE_URL}/blog/feed.xml`,
  `${SITE_URL}/blog/canli-destek-neden-onemli`,
  `${SITE_URL}/blog/chatbot-kurulum-rehberi`,
  `${SITE_URL}/blog/e-ticaret-canli-destek`,
  `${SITE_URL}/blog/whatsapp-ile-musteri-destegi`,
  `${SITE_URL}/blog/ai-musteri-hizmetleri`,
  `${SITE_URL}/blog/musteri-deneyimi-ipuclari`,
]
