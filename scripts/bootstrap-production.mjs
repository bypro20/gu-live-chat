#!/usr/bin/env node
/**
 * Production bootstrap: admin + marketing PRO + Vercel env.
 *
 *   VERCEL_TOKEN=... CRON_SECRET=... node scripts/bootstrap-production.mjs
 */
const BASE = process.env.BASE_URL || 'https://gulivechat.com'
const cronSecret = process.env.CRON_SECRET
const vercelToken = process.env.VERCEL_TOKEN
const team = process.env.VERCEL_TEAM_ID || 'team_5gbzCiGoSSKTC6ONZjWLZigV'
const project = process.env.VERCEL_PROJECT_ID || 'prj_3GcTWiE87xsGrdbFMNkm0FMDvuA4'

if (!cronSecret) {
  console.error('CRON_SECRET gerekli')
  process.exit(1)
}

async function seedAdmin() {
  const res = await fetch(`${BASE}/api/cron/seed-admin`, {
    headers: { Authorization: `Bearer ${cronSecret}` },
    signal: AbortSignal.timeout(120000),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`seed-admin ${res.status}: ${JSON.stringify(data)}`)
  return data
}

async function vercelApi(path, opts = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${vercelToken}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  if (!res.ok) throw new Error(`${res.status} ${path}: ${JSON.stringify(data)}`)
  return data
}

async function upsertEnv(key, value) {
  const { envs } = await vercelApi(`/v9/projects/${project}/env?teamId=${team}`)
  const existing = envs.find((e) => e.key === key)
  const body = {
    key,
    value,
    type: 'encrypted',
    target: ['production', 'preview', 'development'],
  }
  if (existing) {
    await vercelApi(`/v9/projects/${project}/env/${existing.id}?teamId=${team}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    console.log('updated', key)
  } else {
    await vercelApi(`/v10/projects/${project}/env?teamId=${team}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    console.log('created', key)
  }
}

async function main() {
  console.log('1) seed-admin + marketing PRO...')
  const seed = await seedAdmin()
  const marketingId = seed.marketingWebsiteId
  console.log('   marketingWebsiteId:', marketingId)

  if (!vercelToken) {
    console.log('VERCEL_TOKEN yok — env güncellemesi atlandı')
    return
  }

  if (marketingId) {
    console.log('2) Vercel env...')
    await upsertEnv('NEXT_PUBLIC_MARKETING_WEBSITE_ID', marketingId)
    await upsertEnv('NEXT_PUBLIC_WIDGET_WEBSITE_ID', marketingId)
    await upsertEnv('CONTACT_EMAIL', process.env.CONTACT_EMAIL || 'admin@gulivechat.com')
    await upsertEnv('SUPPORT_EMAIL', process.env.SUPPORT_EMAIL || 'destek@gulivechat.com')
    await upsertEnv('EMAIL_FROM', process.env.EMAIL_FROM || 'Gu Live Chat <noreply@gulivechat.com>')
  }

  console.log('3) redeploy...')
  const dep = await vercelApi(`/v13/deployments?teamId=${team}`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'gu-live-chat',
      project,
      target: 'production',
      gitSource: { type: 'github', repoId: 1260043940, ref: 'master' },
    }),
  })
  console.log('   deploy:', dep.url || dep.id)
  console.log('Bootstrap tamam.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
