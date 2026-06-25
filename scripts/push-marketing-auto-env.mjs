#!/usr/bin/env node
/**
 * Tam otomatik pazarlama env'lerini Vercel Production'a ekler.
 * Kullanım: MAIL_NOTIFY_TO=you@gmail.com node scripts/push-marketing-auto-env.mjs
 */
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const SITE = (process.env.SITE_DOMAIN || 'gulivechat.com').replace(/^www\./, '')
const ORIGIN = `https://www.${SITE}`

const notify =
  process.env.MAIL_NOTIFY_TO?.trim() ||
  process.env.ADMIN_EMAIL?.trim() ||
  'bypro1988@gmail.com'

const VARS = {
  MARKETING_AUTO_PUBLISH_SOCIAL: 'true',
  MARKETING_AUTO_LAUNCH_PAID_ADS: 'true',
  MARKETING_SHARE_IMAGE_URL: `${ORIGIN}/opengraph-image`,
  ORGANIC_MARKETING_WEBHOOK_URL: `${ORIGIN}/api/internal/organic-marketing-dispatch`,
  ORGANIC_MARKETING_NOTIFY_EMAIL: notify,
  PAID_MARKETING_NOTIFY_EMAIL: notify,
  MAIL_NOTIFY_TO: notify,
}

for (const [key, value] of Object.entries(process.env)) {
  if (
    key.startsWith('META_') ||
    key.startsWith('LINKEDIN_') ||
    key === 'X_BEARER_TOKEN'
  ) {
    if (value?.trim()) VARS[key] = value.trim()
  }
}

function pushEnv(key, value) {
  const res = spawnSync('npx', ['vercel', 'env', 'add', key, 'production', '--force'], {
    cwd: ROOT,
    input: value,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  if (res.status === 0) {
    console.log(`✓  ${key}`)
    return true
  }
  console.error(`✗  ${key} — ${(res.stderr || res.stdout || '').trim()}`)
  return false
}

let ok = 0
for (const [key, value] of Object.entries(VARS)) {
  if (value && pushEnv(key, value)) ok++
}

console.log(`\n${ok}/${Object.keys(VARS).length} değişken Production'a eklendi.`)
console.log('Sonraki adım: npm run deploy:prod')
