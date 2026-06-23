import { NextResponse } from 'next/server'
import { resolveAgentSocketToken } from '@/lib/secure-tokens'

function internalAuthOk(req: Request): boolean {
  const secret =
    process.env.SOCKET_INTERNAL_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const auth = req.headers.get('authorization') || ''
  return auth === `Bearer ${secret}`
}

/** Railway socket sunucusu — Vercel'de imzalanan agent token'ı doğrular (AUTH_SECRET eşleşmesi gerekmez). */
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

  const payload = resolveAgentSocketToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  return NextResponse.json({
    userId: payload.userId,
    scope: payload.scope,
    exp: payload.exp,
  })
}
