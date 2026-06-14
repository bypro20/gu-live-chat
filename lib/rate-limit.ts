/**
 * In-memory sliding-window rate limiter (per server instance).
 * Suitable for Vercel/serverless — reduces abuse; use Redis for strict global limits.
 */

type Bucket = { count: number; resetAt: number }

const store = new Map<string, Bucket>()

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSec: number; resetAt: number }

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const bucket = store.get(key)

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { ok: true, remaining: limit - 1, resetAt }
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
      resetAt: bucket.resetAt,
    }
  }

  bucket.count += 1
  return { ok: true, remaining: limit - bucket.count, resetAt: bucket.resetAt }
}

export function rateLimitResponse(retryAfterSec: number) {
  return new Response(
    JSON.stringify({ error: 'Çok fazla istek. Lütfen bir süre sonra tekrar deneyin.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSec),
      },
    }
  )
}

export function rateLimitByIp(req: Request, prefix: string, limit: number, windowMs: number) {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  return checkRateLimit(`${prefix}:${ip}`, limit, windowMs)
}
