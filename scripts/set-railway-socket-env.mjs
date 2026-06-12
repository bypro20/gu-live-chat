#!/usr/bin/env node
/**
 * Railway socket servisi — CORS env + redeploy (GraphQL API)
 *
 * Token: RAILWAY_TOKEN env veya ~/.railway/config.json
 * https://railway.com/account/tokens
 */
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const GQL = 'https://backboard.railway.com/graphql/v2'
const PROJECT = process.env.RAILWAY_PROJECT_ID || '698c8b4c-f8a4-45bf-a0ff-1b2d79b673fe'
const ENV = process.env.RAILWAY_ENVIRONMENT_ID || 'a6717241-7b7b-4318-b974-41a65cd951af'
const SERVICE = process.env.RAILWAY_SERVICE_ID || '0cf7e5f3-7727-47d2-8f55-46efaf121ed4'
const WWW = 'https://www.gulivechat.com'
const CORS = 'https://www.gulivechat.com,https://gulivechat.com,https://guchat.org'

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
  const token = loadToken()
  if (!token) {
    console.error('RAILWAY_TOKEN gerekli — https://railway.com/account/tokens')
    process.exit(1)
  }

  console.log('1) Railway env güncelleniyor...')
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
        variables: {
          NEXT_PUBLIC_APP_URL: WWW,
          SOCKET_CORS_ORIGINS: CORS,
        },
      },
    }
  )
  console.log('  ✓ NEXT_PUBLIC_APP_URL, SOCKET_CORS_ORIGINS')

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
