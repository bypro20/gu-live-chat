import { NextResponse } from 'next/server'
import { resolveVisitorToken } from '@/lib/secure-tokens'

function internalAuthOk(req: Request): boolean {
  const secret =
    process.env.SOCKET_INTERNAL_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const auth = req.headers.get('authorization') || ''
  return auth === `Bearer ${secret}`
}

/** Railway socket — Vercel'de imzalanan ziyaretçi token'ını doğrular. */
export async function POST(req: Request) {
  if (!internalAuthOk(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let token = ''
  try {
    const body = await req.json()
    token = typeof body?.token === 'string' ? body.token : ''
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  const payload = resolveVisitorToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  return NextResponse.json({
    visitorId: payload.visitorId,
    websiteId: payload.websiteId,
    sessionId: payload.sessionId,
    exp: payload.exp,
  })
}
