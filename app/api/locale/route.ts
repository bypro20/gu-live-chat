import { NextRequest, NextResponse } from 'next/server'
import { intlLocaleFor, parseLocale } from '@/lib/regional-config'
import { detectLocaleContext, applyLocaleCookies } from '@/lib/locale-server'
import { rateLimitByIp, rateLimitResponse } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const ctx = detectLocaleContext(request)
  const res = NextResponse.json(ctx)
  applyLocaleCookies(res, ctx)
  return res
}

export async function POST(request: NextRequest) {
  const limited = rateLimitByIp(request, 'locale', 30, 60_000)
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

  const body = await request.json().catch(() => ({}))
  const locale = parseLocale(body.locale)
  if (!locale) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 })
  }

  const ctx = detectLocaleContext(request)
  ctx.locale = locale
  ctx.intlLocale = intlLocaleFor(ctx.currency, locale)

  const res = NextResponse.json(ctx)
  applyLocaleCookies(res, ctx, { manual: true })
  return res
}
