#!/usr/bin/env node
/**
 * gulivechat.com — Vercel env, domain, deploy, seed, SEO ping
 * Token: VERCEL_TOKEN env veya ~/.local/share/com.vercel.cli/auth.json
 */
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { execSync } from 'child_process'

const TEAM = process.env.VERCEL_TEAM_ID || 'team_5gbzCiGoSSKTC6ONZjWLZigV'
const PROJECT = process.env.VERCEL_PROJECT_ID || 'prj_3GcTWiE87xsGrdbFMNkm0FMDvuA4'
const DOMAIN = 'gulivechat.com'
const BASE = 'https://www.gulivechat.com'
const SOCKET = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://gu-live-chat-socket-production.up.railway.app'
const CRON = process.env.CRON_SECRET || 'bbb24e55ef705cd8beed91658d7ff8b1772e8c5452b536aa62385fc1a80b6c5d'
const MARKETING_ID = process.env.NEXT_PUBLIC_MARKETING_WEBSITE_ID || 'HA0wSGsbImQ39YDJ4UI5UpY8'

function loadToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN
  try {
    const auth = JSON.parse(readFileSync(join(homedir(), '.local/share/com.vercel.cli/auth.json'), 'utf8'))
    return auth.token
  } catch {
    throw new Error('VERCEL_TOKEN bulunamadı')
  }
}

const TOKEN = loadToken()

async function vercelApi(path, opts = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  if (!res.ok && res.status !== 409) {
    throw new Error(`${res.status} ${path}: ${JSON.stringify(data)}`)
  }
  return { ok: res.ok, status: res.status, data }
}

async function upsertEnv(key, value) {
  const { data: list } = await vercelApi(`/v9/projects/${PROJECT}/env?teamId=${TEAM}`)
  const existing = list.envs?.find((e) => e.key === key)
  if (existing) {
    await vercelApi(`/v9/projects/${PROJECT}/env/${existing.id}?teamId=${TEAM}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    })
    console.log('  ✓ updated', key)
  } else {
    await vercelApi(`/v10/projects/${PROJECT}/env?teamId=${TEAM}`, {
      method: 'POST',
      body: JSON.stringify({
        key,
        value,
        type: 'encrypted',
        target: ['production', 'preview', 'development'],
      }),
    })
    console.log('  ✓ created', key)
  }
}

async function ensureDomain() {
  const r = await vercelApi(`/v10/projects/${PROJECT}/domains?teamId=${TEAM}`, {
    method: 'POST',
    body: JSON.stringify({ name: DOMAIN }),
  })
  if (r.ok) console.log('  ✓ domain added:', DOMAIN)
  else if (r.status === 409) console.log('  · domain already exists:', DOMAIN)
  else console.log('  · domain:', r.status, JSON.stringify(r.data))
}

async function main() {
  console.log('\n1) Vercel production env...')
  const envUpdates = {
    NEXTAUTH_URL: BASE,
    AUTH_URL: BASE,
    NEXT_PUBLIC_APP_URL: BASE,
    SITE_DOMAIN: DOMAIN,
    PLATFORM_NAME: 'Gu Live Chat',
    MARKETING_WEBSITE_DOMAIN: DOMAIN,
    NEXT_PUBLIC_SOCKET_URL: SOCKET,
    SOCKET_SERVER_URL: SOCKET,
    NEXT_PUBLIC_MARKETING_WEBSITE_ID: MARKETING_ID,
    NEXT_PUBLIC_WIDGET_WEBSITE_ID: MARKETING_ID,
    CONTACT_EMAIL: 'admin@gulivechat.com',
    SUPPORT_EMAIL: 'destek@gulivechat.com',
    ADMIN_EMAIL: 'admin@gulivechat.com',
    EMAIL_FROM: 'Gu Live Chat <noreply@gulivechat.com>',
    CRON_SECRET: CRON,
    SOCKET_INTERNAL_SECRET: CRON,
  }
  for (const [k, v] of Object.entries(envUpdates)) {
    await upsertEnv(k, v)
  }

  console.log('\n2) Custom domain...')
  await ensureDomain()

  console.log('\n3) Production deploy (local)...')
  execSync('npx vercel deploy --prod --yes --token ' + TOKEN, {
    stdio: 'inherit',
    cwd: join(homedir(), 'gu-live-chat'),
    env: { ...process.env, VERCEL_ORG_ID: TEAM, VERCEL_PROJECT_ID: PROJECT },
  })

  console.log('\n4) seed-admin (marketing site + DB)...')
  const seedRes = await fetch(`${BASE}/api/cron/seed-admin`, {
    headers: { Authorization: `Bearer ${CRON}` },
    signal: AbortSignal.timeout(120000),
  })
  const seed = await seedRes.json().catch(() => ({}))
  console.log('  seed:', seedRes.status, seed.marketingWebsiteId || seed.message || JSON.stringify(seed).slice(0, 120))

  console.log('\n5) SEO — Bing + IndexNow...')
  const sitemap = `${BASE}/sitemap.xml`
  const bing = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`)
  console.log('  Bing:', bing.status)
  const urls = [
    BASE, `${BASE}/basla`, `${BASE}/canli-destek`, `${BASE}/chatbot`,
    `${BASE}/whatsapp-destek`, `${BASE}/pricing`, `${BASE}/urunler`, `${BASE}/register`,
  ]
  const idx = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: DOMAIN,
      key: '7f3a9b2e1d4c8f6a5b0e3d2c1b4a5f6',
      keyLocation: `${BASE}/7f3a9b2e1d4c8f6a5b0e3d2c1b4a5f6.txt`,
      urlList: urls,
    }),
  })
  console.log('  IndexNow:', idx.status)

  console.log('\n6) Health check...')
  for (const path of ['/', '/api/health', '/api/iyzico/status']) {
    try {
      const r = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(15000) })
      console.log(`  ${path}: ${r.status}`)
    } catch (e) {
      console.log(`  ${path}: FAIL`, e.message)
    }
  }

  console.log('\n✅ gulivechat.com deploy tamamlandı.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
