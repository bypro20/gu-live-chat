#!/usr/bin/env node
/** Compare wrong vs correct password on production auth */
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)="(.*)"$/)
      if (m) process.env[m[1]] = m[2]
    }
  } catch {}
}

loadEnvFile(resolve(process.cwd(), '.env.local'))

const BASE = (process.env.BASE || 'https://www.gulivechat.com').replace(/\/$/, '')
const EMAIL = 'admin@gulivechat.com'

async function tryLogin(password) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`)
  const { csrfToken } = await csrfRes.json()
  const jar = new Map()
  for (const sc of csrfRes.headers.getSetCookie?.() ?? []) {
    const part = sc.split(';')[0]
    const eq = part.indexOf('=')
    if (eq > 0) jar.set(part.slice(0, eq), part.slice(eq + 1))
  }
  const body = new URLSearchParams({ csrfToken, email: EMAIL, password, callbackUrl: `${BASE}/admin`, json: 'true' })
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: [...jar.entries()].map(([k,v])=>`${k}=${v}`).join('; ') },
    body,
    redirect: 'manual',
  })
  return { status: res.status, location: res.headers.get('location'), hasSession: (res.headers.getSetCookie?.() ?? []).some(c => c.includes('session-token')) }
}

async function main() {
  const good = process.env.ADMIN_PASSWORD
  console.log('wrong password:', await tryLogin('definitely-wrong-password-123'))
  console.log('env password:', await tryLogin(good))
}

main()
