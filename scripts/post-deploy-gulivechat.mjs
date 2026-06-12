#!/usr/bin/env node
/** Post-deploy: seed-admin, SEO ping, health — gulivechat.com */
const DOMAIN = 'gulivechat.com'
const WWW = 'www.gulivechat.com'
const BASE = `https://${WWW}`
const CRON = process.env.CRON_SECRET || 'bbb24e55ef705cd8beed91658d7ff8b1772e8c5452b536aa62385fc1a80b6c5d'
const INDEXNOW_KEY = '7f3a9b2e1d4c8f6a5b0e3d2c1b4a5f6'

async function reachable(host) {
  try {
    const r = await fetch(`https://${host}/api/health`, { signal: AbortSignal.timeout(8000) })
    return r.ok
  } catch {
    return false
  }
}

async function main() {
  const host = (await reachable(WWW)) ? WWW : (await reachable(DOMAIN)) ? DOMAIN : null
  if (!host) throw new Error('gulivechat.com erişilebilir değil')
  console.log('Live host:', host)

  console.log('\n1) seed-admin...')
  const seedRes = await fetch(`https://${host}/api/cron/seed-admin`, {
    headers: { Authorization: `Bearer ${CRON}` },
    signal: AbortSignal.timeout(120000),
  })
  const seed = await seedRes.json().catch(() => ({}))
  console.log('  ', seedRes.status, seed.marketingWebsiteId || seed.message || JSON.stringify(seed).slice(0, 200))

  console.log('\n2) seo-index cron...')
  const seoRes = await fetch(`https://${host}/api/cron/seo-index`, {
    headers: { Authorization: `Bearer ${CRON}` },
    signal: AbortSignal.timeout(60000),
  })
  const seo = await seoRes.json().catch(() => ({}))
  console.log('  ', seoRes.status, JSON.stringify(seo).slice(0, 300))

  console.log('\n3) Bing sitemap ping...')
  const sitemap = `${BASE}/sitemap.xml`
  const bing = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`)
  console.log('  Bing:', bing.status)

  console.log('\n4) IndexNow...')
  const urls = [
    BASE, `${BASE}/basla`, `${BASE}/canli-destek`, `${BASE}/chatbot`,
    `${BASE}/whatsapp-destek`, `${BASE}/pricing`, `${BASE}/urunler`, `${BASE}/register`,
  ]
  const idx = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: DOMAIN,
      key: INDEXNOW_KEY,
      keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  })
  console.log('  IndexNow:', idx.status)

  console.log('\n5) Health...')
  for (const h of [WWW, DOMAIN]) {
    try {
      const r = await fetch(`https://${h}/api/health`, { signal: AbortSignal.timeout(10000) })
      console.log(`  ${h}: ${r.status}`)
    } catch (e) {
      console.log(`  ${h}: FAIL (${e.message})`)
    }
  }

  console.log('\n✅ Post-deploy tamam.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
