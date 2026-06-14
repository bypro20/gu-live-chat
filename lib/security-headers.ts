import type { NextResponse } from 'next/server'

export function applySecurityHeaders(res: NextResponse, isProduction: boolean) {
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.headers.set('Cross-Origin-Resource-Policy', 'same-site')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  res.headers.set('X-DNS-Prefetch-Control', 'off')
  res.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  res.headers.set('Origin-Agent-Cluster', '?1')

  if (isProduction) {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
}
