#!/usr/bin/env node
/**
 * Organik pazarlama env'lerini Vercel Production'a ekler.
 * Kullanım: node scripts/push-organic-marketing-env.mjs
 */
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const SITE = process.env.SITE_DOMAIN || 'gulivechat.com'

const VARS = {
  EMAIL_FROM: 'Gu Live Chat <noreply@gulivechat.com>',
  SUPPORT_EMAIL: 'destek@gulivechat.com',
  CONTACT_EMAIL: 'destek@gulivechat.com',
  ORGANIC_MARKETING_NOTIFY_EMAIL: '',
  ORGANIC_MARKETING_WEBHOOK_URL:
    process.env.ORGANIC_MARKETING_WEBHOOK_URL ||
    `https://www.${SITE}/api/internal/organic-marketing-dispatch`,
}

if (process.env.MAIL_NOTIFY_TO?.trim()) {
  VARS.MAIL_NOTIFY_TO = process.env.MAIL_NOTIFY_TO.trim()
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
  if (pushEnv(key, value)) ok++
}

console.log(`\n${ok}/${Object.keys(VARS).length} değişken Vercel Production'a eklendi.`)
if (ok > 0) {
  console.log('Deploy: npm run deploy:prod')
}
