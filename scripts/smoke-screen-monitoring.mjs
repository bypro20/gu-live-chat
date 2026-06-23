#!/usr/bin/env node
/**
 * Production ekran izleme smoke test:
 * widget init → visitor auth → agent auth → screen:start → screenshot round-trip
 *
 *   node scripts/smoke-screen-monitoring.mjs
 */
import { createHmac } from 'crypto'
import { readFileSync, existsSync } from 'fs'
import { io } from 'socket.io-client'

const BASE = (process.env.SMOKE_BASE_URL || 'https://www.gulivechat.com').replace(/\/$/, '')
const WEBSITE = process.env.SMOKE_WEBSITE_ID || 'HA0wSGsbImQ39YDJ4UI5UpY8'
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

function applyEnvFile() {
  const file = loadEnvFile(VERCEL_ENV_FILE)
  for (const [k, v] of Object.entries(file)) {
    if (!process.env[k]) process.env[k] = v
  }
}

function signAgentToken(userId, scope) {
  const secret =
    process.env.WIDGET_TOKEN_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Token secret bulunamadı — VERCEL_ENV_FILE veya NEXTAUTH_SECRET')

  const exp = Math.floor(Date.now() / 1000) + 300
  const body = JSON.stringify({ userId, scope, exp })
  const sig = createHmac('sha256', secret).update(body).digest('base64url')
  return `${Buffer.from(body).toString('base64url')}.${sig}`
}

async function findAdminUserId() {
  if (!process.env.DATABASE_URL) return null
  try {
    const { prisma } = await import('../lib/db.ts')
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    })
    await prisma.$disconnect()
    return admin?.id || null
  } catch {
    return null
  }
}

function waitFor(socket, event, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${event} timeout`)), timeoutMs)
    socket.once(event, (data) => {
      clearTimeout(timer)
      resolve(data)
    })
  })
}

async function connectSocket(label) {
  const s = io(BASE, { path: '/socket.io', transports: ['polling'], timeout: 15000 })
  await new Promise((res, rej) => {
    s.on('connect', res)
    s.on('connect_error', (e) => rej(new Error(`${label} connect: ${e.message}`)))
    setTimeout(() => rej(new Error(`${label} connect timeout`)), 15000)
  })
  return s
}

async function main() {
  applyEnvFile()
  console.log('=== Production ekran izleme smoke test ===')
  console.log('Base:', BASE)

  const init = await fetch(`${BASE}/api/widget/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      websiteId: WEBSITE,
      fingerprint: `screen-smoke-${Date.now()}`,
      currentPage: `${BASE}/`,
      userAgent: 'GuScreenSmoke/1.0',
    }),
  }).then((r) => r.json())

  if (!init.visitorToken || !init.visitorId) throw new Error('widget/init başarısız')

  const visitorSocket = await connectSocket('visitor')
  visitorSocket.emit('visitor:auth', {
    visitorToken: init.visitorToken,
    websiteId: init.websiteId || WEBSITE,
  })
  await waitFor(visitorSocket, 'visitor:auth:ok', 10000)
  console.log('✓ visitor:auth:ok')

  const agentUserId = process.env.SMOKE_AGENT_USER_ID || (await findAdminUserId())
  if (!agentUserId) throw new Error('SMOKE_AGENT_USER_ID veya DATABASE_URL gerekli (platform admin)')

  const agentSocket = await connectSocket('agent')
  const token = signAgentToken(agentUserId, 'platform')
  agentSocket.emit('agent:auth', { token, websiteIds: [WEBSITE], scope: 'platform' })

  const authOk = await Promise.race([
    waitFor(agentSocket, 'agent:auth:ok', 10000).then(() => true),
    waitFor(agentSocket, 'agent:auth:failed', 10000).then(() => false),
  ]).catch(() => false)

  if (!authOk) throw new Error('agent:auth:ok gelmedi — platform admin kullanıcı doğrulanamadı')
  console.log('✓ agent:auth:ok')

  const screenStart = new Promise((resolve) => {
    visitorSocket.on('visitor:screen:start', () => resolve(true))
    setTimeout(() => resolve(false), 8000)
  })

  agentSocket.emit('agent:screen:start', {
    visitorId: init.visitorId,
    websiteId: init.websiteId || WEBSITE,
  })

  const gotStart = await screenStart
  if (!gotStart) throw new Error('visitor:screen:start gelmedi')

  console.log('✓ visitor:screen:start')

  const fakeShot =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k='

  const screenshotPromise = waitFor(agentSocket, 'agent:visitor:screenshot', 8000)
  visitorSocket.emit('visitor:screenshot', {
    visitorId: init.visitorId,
    websiteId: init.websiteId || WEBSITE,
    screenshot: fakeShot,
    viewportW: 1280,
    viewportH: 720,
    scrollY: 0,
    documentH: 2000,
    timestamp: new Date().toISOString(),
  })

  const shot = await screenshotPromise
  if (!shot?.screenshot?.startsWith('data:image')) {
    throw new Error('agent:visitor:screenshot payload hatalı')
  }

  console.log('✓ agent:visitor:screenshot')
  console.log('\n✅ Ekran izleme pipeline production’da çalışıyor.\n')

  visitorSocket.disconnect()
  agentSocket.disconnect()
}

main().catch((e) => {
  console.error('✗', e.message || e)
  process.exit(1)
})
