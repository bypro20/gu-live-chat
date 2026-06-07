#!/usr/bin/env node
/**
 * Vercel'e socket URL'lerini yazar ve production redeploy tetikler.
 *
 * Kullanım:
 *   VERCEL_TOKEN=xxx SOCKET_URL=https://xxx.up.railway.app node scripts/set-socket-env.mjs
 *
 * SOCKET_URL: Railway socket servisinin public URL'si (sondaki / olmadan)
 */
import { createHash } from 'crypto'

const token = process.env.VERCEL_TOKEN
const socketUrl = (process.env.SOCKET_URL || process.argv[2] || '').replace(/\/$/, '')
const team = process.env.VERCEL_TEAM_ID || 'team_5gbzCiGoSSKTC6ONZjWLZigV'
const project = process.env.VERCEL_PROJECT_ID || 'prj_3GcTWiE87xsGrdbFMNkm0FMDvuA4'
const cronSecret = process.env.CRON_SECRET || process.env.SOCKET_INTERNAL_SECRET

if (!token) {
  console.error('VERCEL_TOKEN gerekli')
  process.exit(1)
}
if (!socketUrl) {
  console.error('SOCKET_URL gerekli (Railway public URL)')
  process.exit(1)
}

async function api(path, opts = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
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
  const { envs } = await api(`/v9/projects/${project}/env?teamId=${team}`)
  const existing = envs.find((e) => e.key === key)
  const body = {
    key,
    value,
    type: 'encrypted',
    target: ['production', 'preview', 'development'],
  }
  if (existing) {
    await api(`/v9/projects/${project}/env/${existing.id}?teamId=${team}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    console.log('updated', key)
  } else {
    await api(`/v10/projects/${project}/env?teamId=${team}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    console.log('created', key)
  }
}

async function main() {
  await upsertEnv('NEXT_PUBLIC_SOCKET_URL', socketUrl)
  await upsertEnv('SOCKET_SERVER_URL', socketUrl)
  if (cronSecret) {
    await upsertEnv('SOCKET_INTERNAL_SECRET', cronSecret)
  } else {
    console.warn('CRON_SECRET yok — SOCKET_INTERNAL_SECRET elle Railway+Vercel eşleştirin')
  }

  const body = {
    name: 'gu-live-chat',
    project,
    target: 'production',
    gitSource: { type: 'github', repoId: 1260043940, ref: 'master' },
  }
  const dep = await api(`/v13/deployments?teamId=${team}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  console.log('redeploy started:', dep.url || dep.id)
  console.log('socket health:', `${socketUrl}/health`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
