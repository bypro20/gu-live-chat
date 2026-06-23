#!/usr/bin/env node
/** Manuel SEO indeksleme — Bing ping + IndexNow */
const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.gulivechat.com').replace(/\/$/, '')
const INDEXNOW_KEY = '7f3a9b2e1d4c8f6a5b0e3d2c1b4a5f6'
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`

const PRIORITY_URLS = [
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
]

async function main() {
  console.log('Sitemap:', SITEMAP_URL)

  const bingRes = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`)
  console.log('Bing ping:', bingRes.status, bingRes.ok ? 'OK' : 'FAIL')

  const indexRes = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: PRIORITY_URLS,
    }),
  })
  console.log('IndexNow:', indexRes.status, indexRes.status === 200 || indexRes.status === 202 ? 'OK' : 'FAIL')
}

main().catch((e) => { console.error(e); process.exit(1) })
