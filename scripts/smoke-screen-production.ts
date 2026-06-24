/**
 * Production ekran izleme smoke test (tsx — prisma import)
 *   npx tsx scripts/smoke-screen-production.ts
 */
import { readFileSync, existsSync } from 'fs'
import { io } from 'socket.io-client'
import { createClient } from '@libsql/client'
import { createAgentSocketToken } from '../lib/secure-tokens'

const BASE = (process.env.SMOKE_BASE_URL || 'https://www.gulivechat.com').replace(/\/$/, '')
const WEBSITE = process.env.SMOKE_WEBSITE_ID || 'HA0wSGsbImQ39YDJ4UI5UpY8'
const VERCEL_ENV_FILE = process.env.VERCEL_ENV_FILE || '/tmp/gu-vercel.env'

function loadEnvFile(path: string) {
  const out: Record<string, string> = {}
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
  for (const [k, v] of Object.entries(loadEnvFile(VERCEL_ENV_FILE))) {
    if (!process.env[k]) process.env[k] = v
  }
}

function waitFor<T>(socket: ReturnType<typeof io>, event: string, timeoutMs = 12000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${event} timeout`)), timeoutMs)
    socket.once(event, (data: T) => {
      clearTimeout(timer)
      resolve(data)
    })
  })
}

async function connectSocket(label: string) {
  const s = io(BASE, { path: '/socket.io', transports: ['polling'], timeout: 15000 })
  await new Promise<void>((res, rej) => {
    s.on('connect', () => res())
    s.on('connect_error', (e) => rej(new Error(`${label} connect: ${e.message}`)))
    setTimeout(() => rej(new Error(`${label} connect timeout`)), 15000)
  })
  return s
}

async function findAdminUserId() {
  const url = process.env.DATABASE_URL?.trim()
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim()
  if (!url?.startsWith('libsql://')) return null
  const client = createClient({ url, authToken: authToken || undefined })
  const rs = await client.execute("SELECT id FROM User WHERE role = 'ADMIN' ORDER BY createdAt ASC LIMIT 1")
  return (rs.rows[0]?.id as string) || null
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
  if (!agentUserId) throw new Error('Platform admin kullanıcı bulunamadı')

  const agentSocket = await connectSocket('agent')
  const token = createAgentSocketToken(agentUserId, 'platform')
  agentSocket.emit('agent:auth', { token, websiteIds: [WEBSITE], scope: 'platform' })

  const authOk = await Promise.race([
    waitFor(agentSocket, 'agent:auth:ok', 10000).then(() => true),
    waitFor(agentSocket, 'agent:auth:failed', 10000).then(() => false),
  ]).catch(() => false)

  if (!authOk) throw new Error('agent:auth:ok gelmedi')
  console.log('✓ agent:auth:ok')

  const screenStart = new Promise<boolean>((resolve) => {
    visitorSocket.on('visitor:screen:start', () => resolve(true))
    setTimeout(() => resolve(false), 8000)
  })

  agentSocket.emit('agent:screen:start', {
    visitorId: init.visitorId,
    websiteId: init.websiteId || WEBSITE,
  })

  if (!(await screenStart)) throw new Error('visitor:screen:start gelmedi')
  console.log('✓ visitor:screen:start')

  const fakeShot =
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k='

  const screenshotPromise = waitFor<{ screenshot?: string }>(agentSocket, 'agent:visitor:screenshot', 8000)
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
  if (!shot?.screenshot?.startsWith('data:image')) throw new Error('agent:visitor:screenshot payload hatalı')

  console.log('✓ agent:visitor:screenshot')
  console.log('\n✅ Ekran izleme pipeline production’da çalışıyor.\n')

  visitorSocket.disconnect()
  agentSocket.disconnect()
}

main().catch((e) => {
  console.error('✗', e instanceof Error ? e.message : e)
  process.exit(1)
})
