#!/usr/bin/env node
/**
 * End-to-end admin login test against production (www.gulivechat.com).
 * Loads credentials from .env.local — does not print password.
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnvFile(path, override = false) {
  try {
    const text = readFileSync(path, 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)="(.*)"$/)
      if (m && (override || process.env[m[1]] === undefined)) {
        process.env[m[1]] = m[2]
      }
    }
  } catch {
    /* ignore */
  }
}

loadEnvFile(resolve(process.cwd(), '.env'))
loadEnvFile(resolve(process.cwd(), '.env.local'), true)

const BASE = (process.env.BASE || 'https://www.gulivechat.com').replace(/\/$/, '')
const EMAIL = (process.env.ADMIN_EMAIL || 'admin@gulivechat.com').trim().toLowerCase()
const PASSWORD = process.env.ADMIN_PASSWORD

if (!PASSWORD) {
  console.error('ADMIN_PASSWORD missing in .env.local')
  process.exit(1)
}

function parseSetCookies(res) {
  const raw = res.headers.getSetCookie?.() ?? []
  if (raw.length) return raw
  const single = res.headers.get('set-cookie')
  return single ? [single] : []
}

function cookieJarFrom(setCookies, jar = new Map()) {
  for (const sc of setCookies) {
    const part = sc.split(';')[0]
    const eq = part.indexOf('=')
    if (eq > 0) jar.set(part.slice(0, eq), part.slice(eq + 1))
  }
  return jar
}

function jarHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

async function main() {
  const jar = new Map()

  console.log('1) GET /api/auth/csrf')
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { redirect: 'manual' })
  cookieJarFrom(parseSetCookies(csrfRes), jar)
  const { csrfToken } = await csrfRes.json()
  console.log('   status:', csrfRes.status, 'csrf:', csrfToken ? 'ok' : 'missing')

  console.log('2) POST /api/auth/callback/credentials')
  const body = new URLSearchParams({
    csrfToken,
    email: EMAIL,
    password: PASSWORD,
    callbackUrl: `${BASE}/admin`,
    json: 'true',
  })
  const signInRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: jarHeader(jar),
    },
    body,
    redirect: 'manual',
  })
  cookieJarFrom(parseSetCookies(signInRes), jar)
  const signInText = await signInRes.text()
  let signInJson
  try {
    signInJson = JSON.parse(signInText)
  } catch {
    signInJson = { raw: signInText.slice(0, 200) }
  }
  console.log('   status:', signInRes.status, 'location:', signInRes.headers.get('location'))
  console.log('   set-cookie:', parseSetCookies(signInRes))
  console.log('   body:', signInJson)
  console.log('   jar after sign-in:', [...jar.keys()])

  console.log('3) GET /api/auth/session')
  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: jarHeader(jar) },
    cache: 'no-store',
  })
  const session = await sessionRes.json()
  console.log('   status:', sessionRes.status)
  console.log('   user:', session?.user ? { email: session.user.email, role: session.user.role, id: session.user.id } : null)

  console.log('4) GET /api/admin/me')
  const meRes = await fetch(`${BASE}/api/admin/me`, {
    headers: { Cookie: jarHeader(jar) },
    cache: 'no-store',
  })
  const meText = await meRes.text()
  console.log('   status:', meRes.status, 'body:', meText.slice(0, 300))

  const ok = meRes.ok && session?.user?.role === 'ADMIN'
  console.log('\nRESULT:', ok ? 'LOGIN_OK' : 'LOGIN_FAIL')
  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
