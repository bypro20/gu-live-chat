#!/usr/bin/env node
/**
 * Ekran izleme / socket auth — Vercel secret hizalama + Railway env + redeploy
 *
 *   node scripts/fix-socket-production.mjs
 *
 * Gerekli: Vercel CLI auth (~/.local/share/com.vercel.cli/auth.json)
 * Opsiyonel: RAILWAY_TOKEN veya ~/.railway/config.json
 */
import { readFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join, dirname } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import {
  loadVercelToken,
  triggerGitProductionDeploy,
  waitForDeployment,
  VERCEL_TEAM_ID as TEAM,
  VERCEL_PROJECT_ID as PROJECT,
} from './lib/vercel-git-deploy.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VERCEL_ENV_FILE = process.env.VERCEL_ENV_FILE || '/tmp/gu-vercel.env'

function loadEnvFile(path) {
  const out = {}
  if (!existsSync(path)) return out
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!m) continue
    let v = m[2]
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    out[m[1]] = v
  }
  return out
}

async function vercelApi(token, path, opts = {}) {
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
  if (!res.ok && res.status !== 409) throw new Error(`${res.status} ${path}: ${JSON.stringify(data)}`)
  return data
}

async function upsertEnv(token, key, value) {
  const { envs } = await vercelApi(token, `/v9/projects/${PROJECT}/env?teamId=${TEAM}`)
  const existing = envs?.find((e) => e.key === key)
  const body = { key, value, type: 'encrypted', target: ['production', 'preview', 'development'] }
  if (existing) {
    await vercelApi(token, `/v9/projects/${PROJECT}/env/${existing.id}?teamId=${TEAM}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  } else {
    await vercelApi(token, `/v10/projects/${PROJECT}/env?teamId=${TEAM}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }
  console.log('  ✓ Vercel env', key)
}

async function main() {
  console.log('\n1) Vercel production env çekiliyor...')
  if (!existsSync(VERCEL_ENV_FILE)) {
    execSync(`npx vercel env pull ${VERCEL_ENV_FILE} --environment=production --yes`, {
      stdio: 'inherit',
      cwd: ROOT,
    })
  }
  const pulled = loadEnvFile(VERCEL_ENV_FILE)
  const signingSecret =
    pulled.AUTH_SECRET ||
    pulled.WIDGET_TOKEN_SECRET ||
    pulled.NEXTAUTH_SECRET
  const internalSecret =
    pulled.SOCKET_INTERNAL_SECRET ||
    pulled.CRON_SECRET

  if (!signingSecret) throw new Error('NEXTAUTH_SECRET / AUTH_SECRET bulunamadı')
  if (!internalSecret) throw new Error('CRON_SECRET / SOCKET_INTERNAL_SECRET bulunamadı')

  console.log('\n2) Vercel token imzalama secret hizalanıyor...')
  const token = loadVercelToken()
  await upsertEnv(token, 'AUTH_SECRET', signingSecret)
  await upsertEnv(token, 'WIDGET_TOKEN_SECRET', signingSecret)
  await upsertEnv(token, 'SOCKET_INTERNAL_SECRET', internalSecret)

  console.log('\n3) Vercel production deploy (GitHub master)...')
  const dep = await triggerGitProductionDeploy({ token })
  await waitForDeployment(token, dep.id)
  console.log('  ✓ deploy ready:', dep.url || dep.id)

  console.log('\n4) Railway env + redeploy...')
  execSync('node scripts/set-railway-socket-env.mjs', {
    stdio: 'inherit',
    cwd: ROOT,
    env: {
      ...process.env,
      AUTH_SECRET: signingSecret,
      WIDGET_TOKEN_SECRET: signingSecret,
      NEXTAUTH_SECRET: pulled.NEXTAUTH_SECRET || signingSecret,
      CRON_SECRET: internalSecret,
      SOCKET_INTERNAL_SECRET: internalSecret,
    },
  })

  console.log('\n5) Production smoke test...')
  execSync('node scripts/smoke-socket-auth.mjs', {
    stdio: 'inherit',
    cwd: join(homedir(), 'Projects/gu-live-chat'),
  })

  console.log('\n✅ Socket / ekran izleme düzeltmesi tamam.\n')
}

main().catch((e) => {
  console.error('\n❌', e.message || e)
  process.exit(1)
})
