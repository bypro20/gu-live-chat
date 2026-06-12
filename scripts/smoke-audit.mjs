#!/usr/bin/env node
/** Production smoke audit for gulivechat.com */
const BASE = process.env.BASE_URL || 'https://gulivechat.com'
const SOCKET = process.env.SOCKET_URL || 'https://gu-live-chat-socket-production.up.railway.app'
const WID = process.env.WIDGET_WEBSITE_ID || 'HA0wSGsbImQ39YDJ4UI5UpY8'

const pages = [
  '/',
  '/features',
  '/pricing',
  '/contact',
  '/help',
  '/blog',
  '/login',
  '/register',
  '/admin-login',
  '/dashboard',
  '/inbox',
  '/contacts',
  '/visitors',
  '/analytics',
  '/admin',
  '/admin/inbox',
  '/admin/users',
  '/admin/websites',
  '/admin/visitors',
  '/admin/ip-bans',
  '/admin/settings',
]

const apis = [
  { method: 'GET', path: '/api/health', expect: (d, s) => s === 200 && d.ok && d.db },
  { method: 'GET', path: '/api/v1/health', expect: (d, s) => s === 200 },
  { method: 'GET', path: '/api/admin/inbox/setup', expect: (_, s) => s === 401 },
  { method: 'GET', path: '/api/conversations', expect: (_, s) => s === 401 },
  { method: 'GET', path: '/api/dashboard/stats', expect: (_, s) => s === 401 },
  { method: 'POST', path: '/api/widget/init', body: { websiteId: WID, fingerprint: 'audit-fp-1', currentPage: 'https://gulivechat.com/' }, expect: (d, s) => s === 200 && !!d.visitorToken },
  { method: 'POST', path: '/api/contact', body: { name: 'Audit', email: 'audit@test.com', subject: 'Smoke', message: 'smoke test' }, expect: (d, s) => s === 200 && d.success },
  { method: 'GET', path: '/api/cron/seed-admin', expect: (_, s) => s === 401 },
]

async function fetchPage(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(15000) })
  const loc = res.headers.get('location')
  return { status: res.status, redirect: loc }
}

async function fetchApi({ method, path, body }) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  })
  let data = null
  const text = await res.text()
  try { data = JSON.parse(text) } catch { data = { _raw: text.slice(0, 120) } }
  return { status: res.status, data }
}

const results = { pass: [], fail: [], warn: [] }

function pass(name, detail = '') { results.pass.push({ name, detail }) }
function fail(name, detail = '') { results.fail.push({ name, detail }) }
function warn(name, detail = '') { results.warn.push({ name, detail }) }

console.log(`Audit: ${BASE}\n`)

// Socket
try {
  const r = await fetch(`${SOCKET}/health`, { signal: AbortSignal.timeout(8000) })
  const d = await r.json()
  if (r.ok && d.service === 'gu-live-chat-socket' && d.socketReady) pass('socket-server', SOCKET)
  else fail('socket-server', JSON.stringify(d))
} catch (e) {
  fail('socket-server', String(e.message))
}

for (const p of pages) {
  try {
    const r = await fetchPage(p)
    if ([200, 301, 302, 307, 308].includes(r.status)) pass(`page ${p}`, `${r.status}${r.redirect ? ' → ' + r.redirect : ''}`)
    else fail(`page ${p}`, `status ${r.status}`)
  } catch (e) {
    fail(`page ${p}`, e.message)
  }
}

for (const a of apis) {
  try {
    const { status, data } = await fetchApi(a)
    if (a.expect(data, status)) pass(`api ${a.method} ${a.path}`, String(status))
    else fail(`api ${a.method} ${a.path}`, `${status} ${JSON.stringify(data).slice(0, 150)}`)
  } catch (e) {
    fail(`api ${a.method} ${a.path}`, e.message)
  }
}

// Widget message roundtrip (init + message)
try {
  const init = await fetchApi({ method: 'POST', path: '/api/widget/init', body: { websiteId: WID, fingerprint: 'audit-msg-fp', currentPage: 'https://gulivechat.com/' } })
  if (!init.data?.visitorToken) throw new Error('no visitorToken')
  const msg = await fetchApi({
    method: 'POST',
    path: '/api/widget/message',
    body: {
      websiteId: WID,
      fingerprint: `audit-fp-${Date.now()}`,
      content: `[audit] smoke ${Date.now()}`,
      type: 'TEXT',
    },
  })
  if ((msg.status === 200 || msg.status === 201) && msg.data?.message?.id) pass('widget message', msg.data.message.id)
  else fail('widget message', `${msg.status} ${JSON.stringify(msg.data).slice(0, 120)}`)
} catch (e) {
  fail('widget message flow', e.message)
}

console.log(`\n=== PASS ${results.pass.length} ===`)
for (const r of results.pass) console.log('  ✓', r.name, r.detail ? `(${r.detail})` : '')

if (results.warn.length) {
  console.log(`\n=== WARN ${results.warn.length} ===`)
  for (const r of results.warn) console.log('  !', r.name, r.detail)
}

if (results.fail.length) {
  console.log(`\n=== FAIL ${results.fail.length} ===`)
  for (const r of results.fail) console.log('  ✗', r.name, r.detail)
  process.exit(1)
}

console.log('\nAll checks passed.')
