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
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "media-src 'self' blob: https:",
      "worker-src 'self' blob:",
    ].join('; '),
  )

  if (isProduction) {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    res.headers.get('Content-Security-Policy')
    const csp = res.headers.get('Content-Security-Policy')
    if (csp && !csp.includes('upgrade-insecure-requests')) {
      res.headers.set('Content-Security-Policy', `${csp}; upgrade-insecure-requests`)
    }
  }
}
