#!/usr/bin/env node
/** Update Vercel ADMIN_PASSWORD and run production seed-admin */
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join, resolve } from 'path'

const TEAM = 'team_5gbzCiGoSSKTC6ONZjWLZigV'
const PROJECT = 'prj_3GcTWiE87xsGrdbFMNkm0FMDvuA4'
const BASE = 'https://www.gulivechat.com'

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)="(.*)"$/)
      if (m) process.env[m[1]] = m[2]
    }
  } catch {}
}

loadEnv(resolve(process.cwd(), '.env.local'))

const TOKEN = process.env.VERCEL_TOKEN || JSON.parse(
  readFileSync(join(homedir(), '.local/share/com.vercel.cli/auth.json'), 'utf8')
).token

const password = process.env.ADMIN_PASSWORD
const cron = process.env.CRON_SECRET
if (!password || !cron) throw new Error('ADMIN_PASSWORD ve CRON_SECRET gerekli')

async function vercelApi(path, opts = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${res.status} ${path}: ${JSON.stringify(data)}`)
  return data
}

async function main() {
  const { envs } = await vercelApi(`/v9/projects/${PROJECT}/env?teamId=${TEAM}`)
  const existing = envs?.find((e) => e.key === 'ADMIN_PASSWORD')
  if (existing) {
    await vercelApi(`/v9/projects/${PROJECT}/env/${existing.id}?teamId=${TEAM}`, {
      method: 'PATCH',
      body: JSON.stringify({ value: password }),
    })
  } else {
    await vercelApi(`/v10/projects/${PROJECT}/env?teamId=${TEAM}`, {
      method: 'POST',
      body: JSON.stringify({
        key: 'ADMIN_PASSWORD',
        value: password,
        type: 'encrypted',
        target: ['production', 'preview', 'development'],
      }),
    })
  }
  console.log('✓ Vercel ADMIN_PASSWORD güncellendi')

  const seedRes = await fetch(`${BASE}/api/cron/seed-admin`, {
    headers: { Authorization: `Bearer ${cron}` },
    signal: AbortSignal.timeout(120000),
  })
  const seed = await seedRes.json().catch(() => ({}))
  console.log('✓ seed-admin:', seedRes.status, seed.passwordMatches ?? seed.message ?? '')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
