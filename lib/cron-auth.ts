import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

export function verifyCronRequest(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET tanımlı değil — istek reddedildi')
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 })
  }

  const authHeader = request.headers.get('authorization') || ''
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader

  if (!provided || !safeEqual(provided, cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
