import crypto from 'crypto'

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type VisitorTokenPayload = {
  visitorId: string
  websiteId: string
  sessionId: string
  exp?: number
}

function tokenSecret(): string | null {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  return secret?.trim() || null
}

/** HMAC imzalı ziyaretçi jetonu — widget API ve socket doğrulaması */
export function createVisitorToken(
  payload: Omit<VisitorTokenPayload, 'exp'>,
  ttlMs = TOKEN_TTL_MS
): string {
  const secret = tokenSecret()
  const data: VisitorTokenPayload = { ...payload, exp: Date.now() + ttlMs }
  const json = JSON.stringify(data)

  if (!secret) {
    return Buffer.from(json).toString('base64')
  }

  const body = Buffer.from(json).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(json).digest('base64url')
  return `${body}.${sig}`
}

export function resolveVisitorToken(token: string): VisitorTokenPayload | null {
  if (!token?.trim()) return null

  const secret = tokenSecret()

  if (token.includes('.')) {
    const dot = token.indexOf('.')
    const body = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    if (!secret) return null
    try {
      const json = Buffer.from(body, 'base64url').toString('utf8')
      const expected = crypto.createHmac('sha256', secret).update(json).digest('base64url')
      const sigBuf = Buffer.from(sig)
      const expBuf = Buffer.from(expected)
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return null
      }
      const payload = JSON.parse(json) as VisitorTokenPayload
      if (typeof payload.exp === 'number' && payload.exp < Date.now()) return null
      if (!payload.visitorId || !payload.websiteId) return null
      return payload
    } catch {
      return null
    }
  }

  // Eski base64 jetonlar — yalnızca geliştirme / geçiş
  if (process.env.NODE_ENV === 'production' && secret) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8')) as VisitorTokenPayload
    if (!payload.visitorId || !payload.websiteId) return null
    return payload
  } catch {
    return null
  }
}
