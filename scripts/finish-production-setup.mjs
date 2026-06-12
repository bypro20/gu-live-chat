#!/usr/bin/env node
/** Production son rötuş: Vercel domain redirect, env, Railway CORS */
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { execSync } from 'child_process'

const TEAM = 'team_5gbzCiGoSSKTC6ONZjWLZigV'
const PROJECT = 'prj_3GcTWiE87xsGrdbFMNkm0FMDvuA4'
const WWW = 'www.gulivechat.com'
const APEX = 'gulivechat.com'
const SOCKET = 'https://gu-live-chat-socket-production.up.railway.app'
const CORS = 'https://www.gulivechat.com,https://gulivechat.com,https://guchat.org'
const GOOGLE_VERIFY = '6rvC_wtUp9XHeIa0nxjGglIILkJjEW440tlaGqFbXVQ'
const CRON = process.env.CRON_SECRET || 'bbb24e55ef705cd8beed91658d7ff8b1772e8c5452b536aa62385fc1a80b6c5d'

function loadToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN
  return JSON.parse(readFileSync(join(homedir(), '.local/share/com.vercel.cli/auth.json'), 'utf8')).token
}

const TOKEN = loadToken()

async function api(path, opts = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { ok: res.ok, status: res.status, data }
}

async function upsertEnv(key, value) {
  const { data: list } = await api(`/v9/projects/${PROJECT}/env?teamId=${TEAM}`)
  const existing = list.envs?.find((e) => e.key === key)
  const body = { key, value, type: 'encrypted', target: ['production', 'preview', 'development'] }
  if (existing) {
    await api(`/v9/projects/${PROJECT}/env/${existing.id}?teamId=${TEAM}`, { method: 'PATCH', body: JSON.stringify(body) })
  } else {
    await api(`/v10/projects/${PROJECT}/env?teamId=${TEAM}`, { method: 'POST', body: JSON.stringify(body) })
  }
  console.log('  ✓ Vercel env', key)
}

async function main() {
  console.log('\n1) gulivechat.com → www redirect (Vercel)...')
  const patch = await api(`/v10/projects/${PROJECT}/domains/${APEX}?teamId=${TEAM}`, {
    method: 'PATCH',
    body: JSON.stringify({ redirect: WWW, redirectStatusCode: 308 }),
  })
  console.log('  ', patch.status, JSON.stringify(patch.data?.redirect || patch.data).slice(0, 80))

  console.log('\n2) Vercel env...')
  await upsertEnv('GOOGLE_SITE_VERIFICATION', GOOGLE_VERIFY)
  await upsertEnv('NEXT_PUBLIC_APP_URL', `https://${WWW}`)
  await upsertEnv('NEXTAUTH_URL', `https://${WWW}`)
  await upsertEnv('AUTH_URL', `https://${WWW}`)

  console.log('\n3) Railway socket CORS...')
  try {
    execSync('node scripts/set-railway-socket-env.mjs', {
      stdio: 'inherit',
      cwd: join(homedir(), 'gu-live-chat'),
      env: process.env,
    })
  } catch {
    console.log('  ⚠ Railway güncellenemedi — token: https://railway.com/account/tokens')
    console.log(`     RAILWAY_TOKEN=... node scripts/set-railway-socket-env.mjs`)
    console.log(`     veya panelden: NEXT_PUBLIC_APP_URL=https://${WWW}`)
    console.log(`     SOCKET_CORS_ORIGINS=${CORS}`)
  }

  console.log('\n4) Socket health...')
  const h = await fetch(`${SOCKET}/health`).then((r) => r.json()).catch(() => null)
  console.log('  ', h ? JSON.stringify(h).slice(0, 120) : 'FAIL')

  console.log('\n5) SEO cron...')
  const seo = await fetch(`https://${WWW}/api/cron/seo-index`, {
    headers: { Authorization: `Bearer ${CRON}` },
  }).then((r) => r.json()).catch(() => ({}))
  console.log('  ', JSON.stringify(seo).slice(0, 200))

  console.log('\n✅ Production setup tamam.\n')
  console.log('Google Search Console: https://search.google.com/search-console')
  console.log(`  → URL prefix: https://${WWW}`)
  console.log(`  → Doğrulama meta etiketi zaten sitede: ${GOOGLE_VERIFY}`)
  console.log(`  → Sitemap: https://${WWW}/sitemap.xml\n`)
}

main().catch(console.error)
