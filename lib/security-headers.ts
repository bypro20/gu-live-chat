import type { NextResponse } from 'next/server'

export function applySecurityHeaders(res: NextResponse, isProduction: boolean) {
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.headers.set('Cross-Origin-Resource-Policy', 'same-site')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (isProduction) {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
}
