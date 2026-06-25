#!/usr/bin/env node
/**
 * Production deploy sonrası health + schema sync.
 * CI ve deploy:auto tarafından kullanılır.
 */
const BASE = (process.env.PRODUCTION_URL || 'https://www.gulivechat.com').replace(/\/$/, '')
const CRON_SECRET = process.env.CRON_SECRET?.trim()
const HEALTH_PATH = process.env.HEALTH_PATH || '/api/health'
const MAX_ATTEMPTS = Number(process.env.DEPLOY_HEALTH_ATTEMPTS || 36)
const POLL_MS = Number(process.env.DEPLOY_HEALTH_POLL_MS || 10_000)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForHealth() {
  console.log(`Health bekleniyor: ${BASE}${HEALTH_PATH}`)
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${BASE}${HEALTH_PATH}`, {
        signal: AbortSignal.timeout(20_000),
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (res.ok) {
        console.log(`✅ Health OK (deneme ${attempt}/${MAX_ATTEMPTS})`)
        return
      }
      console.log(`  deneme ${attempt}: HTTP ${res.status}`)
    } catch (e) {
      console.log(`  deneme ${attempt}: ${e instanceof Error ? e.message : e}`)
    }
    if (attempt < MAX_ATTEMPTS) await sleep(POLL_MS)
  }
  throw new Error(`Production health zaman aşımı (${BASE}${HEALTH_PATH})`)
}

async function runSchemaSync() {
  if (!CRON_SECRET) {
    console.log('ℹ️  CRON_SECRET yok — schema sync atlandı (Vercel cron yine de çalışır)')
    return null
  }

  const res = await fetch(`${BASE}/api/cron/schema-sync`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
    signal: AbortSignal.timeout(120_000),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Schema sync failed (${res.status}): ${JSON.stringify(data)}`)
  }
  console.log('✅ Schema sync:', data.applied?.length ?? 0, 'applied,', data.skipped?.length ?? 0, 'skipped')
  return data
}

async function main() {
  await waitForHealth()
  await runSchemaSync()
  console.log('✅ Post-deploy tamam')
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
