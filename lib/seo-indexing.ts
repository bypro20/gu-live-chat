import { SITE_URL } from '@/lib/seo'

/** IndexNow anahtarı — public/{key}.txt dosyasında barındırılır */
export const INDEXNOW_KEY = '7f3a9b2e1d4c8f6a5b0e3d2c1b4a5f6'

export const SITEMAP_URL = `${SITE_URL}/sitemap.xml`

/** Google/Bing indeksleme için öncelikli sayfalar — gulivechat.com */
export const PRIORITY_URLS = [
  SITE_URL,
  `${SITE_URL}/basla`,
  `${SITE_URL}/canli-destek`,
  `${SITE_URL}/chatbot`,
  `${SITE_URL}/whatsapp-destek`,
  `${SITE_URL}/pricing`,
  `${SITE_URL}/urunler`,
  `${SITE_URL}/features`,
  `${SITE_URL}/ai`,
  `${SITE_URL}/integrations`,
  `${SITE_URL}/register`,
  `${SITE_URL}/mobil-indir`,
  `${SITE_URL}/blog`,
  `${SITE_URL}/blog/canli-destek-neden-onemli`,
  `${SITE_URL}/blog/chatbot-kurulum-rehberi`,
  `${SITE_URL}/blog/e-ticaret-canli-destek`,
  `${SITE_URL}/blog/whatsapp-ile-musteri-destegi`,
  `${SITE_URL}/blog/ai-musteri-hizmetleri`,
]

export type IndexingResult = {
  bingPing: { ok: boolean; status?: number; error?: string }
  indexNow: { ok: boolean; status?: number; error?: string }
  submittedUrls: number
}

export async function pingBingSitemap(): Promise<IndexingResult['bingPing']> {
  try {
    const res = await fetch(
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
      { method: 'GET', signal: AbortSignal.timeout(15000) }
    )
    return { ok: res.ok, status: res.status }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Bing ping failed' }
  }
}

export async function submitIndexNow(urls: string[] = PRIORITY_URLS): Promise<IndexingResult['indexNow']> {
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, 10000),
      }),
      signal: AbortSignal.timeout(20000),
    })
    return { ok: res.status === 200 || res.status === 202, status: res.status }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'IndexNow failed' }
  }
}

export async function runSeoIndexing(): Promise<IndexingResult> {
  const [bingPing, indexNow] = await Promise.all([
    pingBingSitemap(),
    submitIndexNow(),
  ])
  return { bingPing, indexNow, submittedUrls: PRIORITY_URLS.length }
}
