#!/usr/bin/env node
/**
 * Railway socket servisi — CORS env + redeploy (GraphQL API)
 *
 * Token: RAILWAY_TOKEN env veya ~/.railway/config.json
 * https://railway.com/account/tokens
 */
import { readFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const GQL = 'https://backboard.railway.com/graphql/v2'
const PROJECT = process.env.RAILWAY_PROJECT_ID || '698c8b4c-f8a4-45bf-a0ff-1b2d79b673fe'
const ENV = process.env.RAILWAY_ENVIRONMENT_ID || 'a6717241-7b7b-4318-b974-41a65cd951af'
const SERVICE = process.env.RAILWAY_SERVICE_ID || '0cf7e5f3-7727-47d2-8f55-46efaf121ed4'
const WWW = 'https://www.gulivechat.com'
const CORS = 'https://www.gulivechat.com,https://gulivechat.com,https://guchat.org'
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

function applyVercelEnvFile() {
  const file = loadEnvFile(VERCEL_ENV_FILE)
  for (const [k, v] of Object.entries(file)) {
    if (!process.env[k]) process.env[k] = v
  }
}

function loadToken() {
  if (process.env.RAILWAY_TOKEN?.trim()) return process.env.RAILWAY_TOKEN.trim()
  if (process.env.RAILWAY_API_TOKEN?.trim()) return process.env.RAILWAY_API_TOKEN.trim()
  try {
    const cfg = JSON.parse(readFileSync(join(homedir(), '.railway/config.json'), 'utf8'))
    return cfg.user?.token || cfg.user?.accessToken || null
  } catch {
    return null
  }
}

async function gql(token, query, variables = {}) {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  const data = await res.json()
  if (data.errors?.length) {
    throw new Error(data.errors.map((e) => e.message).join('; '))
  }
  return data.data
}

async function main() {
  applyVercelEnvFile()
  const token = loadToken()
  if (!token) {
    console.error('RAILWAY_TOKEN gerekli — https://railway.com/account/tokens')
    process.exit(1)
  }

  console.log('1) Railway env güncelleniyor...')
  const railwayVars = {
    NEXT_PUBLIC_APP_URL: WWW,
    SOCKET_CORS_ORIGINS: CORS,
  }
  const internalSecret = process.env.SOCKET_INTERNAL_SECRET?.trim() || process.env.CRON_SECRET?.trim()
  if (internalSecret) {
    railwayVars.SOCKET_INTERNAL_SECRET = internalSecret
    railwayVars.CRON_SECRET = internalSecret
  }
  const authSecret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.WIDGET_TOKEN_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim()
  if (authSecret) {
    railwayVars.AUTH_SECRET = authSecret
    railwayVars.WIDGET_TOKEN_SECRET = authSecret
    railwayVars.NEXTAUTH_SECRET = authSecret
  }

  await gql(
    token,
    `mutation($input: VariableCollectionUpsertInput!) {
      variableCollectionUpsert(input: $input)
    }`,
    {
      input: {
        projectId: PROJECT,
        environmentId: ENV,
        serviceId: SERVICE,
        variables: railwayVars,
      },
    }
  )
  console.log('  ✓', Object.keys(railwayVars).join(', '))

  console.log('\n2) Redeploy tetikleniyor...')
  const dep = await gql(
    token,
    `mutation($input: ServiceInstanceDeployInput!) {
      serviceInstanceDeploy(input: $input)
    }`,
    {
      input: {
        serviceId: SERVICE,
        environmentId: ENV,
      },
    }
  )
  console.log('  ✓ deploy:', dep.serviceInstanceDeploy?.id || 'ok')

  console.log('\n3) Health bekleniyor...')
  const socket = 'https://gu-live-chat-socket-production.up.railway.app'
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    try {
      const h = await fetch(`${socket}/health`).then((r) => r.json())
      if (h?.status === 'ok' && h.uptimeSec < 120) {
        console.log('  ✓ yeni instance, uptime:', h.uptimeSec, 's')
        break
      }
      if (i === 23) console.log('  · uptime hâlâ yüksek — deploy devam ediyor olabilir')
    } catch {
      /* retry */
    }
  }

  console.log('\n4) CORS doğrulama...')
  const r = await fetch(`${socket}/socket.io/?EIO=4&transport=polling`, {
    headers: { Origin: WWW },
  })
  const allow = r.headers.get('access-control-allow-origin')
  console.log('  access-control-allow-origin:', allow || '(yok — deploy bekleyin)')
  if (allow === WWW) {
    console.log('\n✅ Railway socket CORS hazır.\n')
  } else {
    console.log('\n⚠ CORS henüz güncellenmedi — 1-2 dk sonra tekrar deneyin.\n')
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
