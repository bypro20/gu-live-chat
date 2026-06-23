#!/usr/bin/env node
/** Production: widget init → visitor:auth:ok → agent token path */
import { io } from 'socket.io-client'

const BASE = 'https://www.gulivechat.com'
const WEBSITE = process.env.SMOKE_WEBSITE_ID || 'HA0wSGsbImQ39YDJ4UI5UpY8'

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const init = await fetch(`${BASE}/api/widget/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      websiteId: WEBSITE,
      fingerprint: `smoke-${Date.now()}`,
      currentPage: `${BASE}/`,
      userAgent: 'GuSmoke/1.0',
    }),
  }).then((r) => r.json())

  if (!init.visitorToken) throw new Error('widget/init token yok')

  const vs = io(BASE, { path: '/socket.io', transports: ['polling'], timeout: 15000 })
  await new Promise((res, rej) => {
    vs.on('connect', res)
    vs.on('connect_error', (e) => rej(new Error(e.message)))
    setTimeout(() => rej(new Error('visitor connect timeout')), 15000)
  })

  const authOk = new Promise((resolve) => {
    vs.on('visitor:auth:ok', () => resolve(true))
    vs.on('visitor:auth:failed', () => resolve(false))
    setTimeout(() => resolve(false), 8000)
  })
  vs.emit('visitor:auth', {
    visitorToken: init.visitorToken,
    websiteId: init.websiteId || WEBSITE,
  })
  const ok = await authOk
  vs.disconnect()

  if (!ok) throw new Error('visitor:auth:ok gelmedi — Railway secret hâlâ uyumsuz')
  console.log('✓ visitor:auth:ok')
}

main().catch((e) => {
  console.error('✗', e.message)
  process.exit(1)
})
