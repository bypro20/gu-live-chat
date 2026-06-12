import { SITE_DOMAIN } from './site-config'

/** Production CORS — Railway env eksik olsa bile gulivechat.com çalışsın */
const CANONICAL_ORIGINS = [
  `https://${SITE_DOMAIN}`,
  `https://www.${SITE_DOMAIN}`,
  'https://guchat.org',
]

/** Socket.io CORS — ana site + www + ek origin'ler (Railway production). */
export function socketCorsOrigins(): string | string[] {
  const origins = new Set<string>(CANONICAL_ORIGINS)

  const app = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (app) {
    origins.add(app)
    try {
      const u = new URL(app)
      if (u.hostname.startsWith('www.')) {
        origins.add(`${u.protocol}//${u.hostname.slice(4)}`)
      } else {
        origins.add(`${u.protocol}//www.${u.hostname}`)
      }
    } catch {
      /* ignore invalid URL */
    }
  }

  const extra =
    process.env.SOCKET_CORS_ORIGINS?.split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean) ?? []
  for (const o of extra) origins.add(o)

  if (origins.size === 0) return '*'
  return [...origins]
}
