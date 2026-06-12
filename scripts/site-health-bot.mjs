#!/usr/bin/env node
/**
 * Site sağlık botu — production kontrol + otomatik onarım tetikler.
 *
 *   CRON_SECRET=... node scripts/site-health-bot.mjs
 *   BASE_URL=https://gulivechat.com (varsayılan)
 *
 * Production cron: her 15 dk (vercel.json). Aynı kritik hata için admin bildirimi en fazla 6 saatte bir.
 */
const BASE = (process.env.BASE_URL || 'https://gulivechat.com').replace(/\/$/, '')
const secret = process.env.CRON_SECRET

if (!secret) {
  console.error('CRON_SECRET gerekli')
  process.exit(1)
}

const res = await fetch(`${BASE}/api/cron/site-health-bot`, {
  headers: { Authorization: `Bearer ${secret}` },
  signal: AbortSignal.timeout(120000),
})

const data = await res.json().catch(() => ({}))
console.log(JSON.stringify(data, null, 2))

if (!res.ok) process.exit(1)
console.log('\nSite health bot tamamlandı.')
