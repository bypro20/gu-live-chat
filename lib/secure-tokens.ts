import { createHmac, timingSafeEqual } from 'crypto'

export type VisitorTokenPayload = {
  visitorId: string
  websiteId: string
  sessionId: string
  exp: number
}

export type AgentSocketTokenPayload = {
  userId: string
  scope?: 'platform' | 'tenant'
  exp: number
}

function getSigningSecret(): string {
  const secret =
    process.env.WIDGET_TOKEN_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim()

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('WIDGET_TOKEN_SECRET or AUTH_SECRET must be set in production')
    }
    return 'dev-insecure-token-secret-do-not-use-in-production'
  }
  return secret
}

function signBody(body: string): string {
  return createHmac('sha256', getSigningSecret()).update(body).digest('base64url')
}

function verifySignature(body: string, signature: string): boolean {
  const expected = signBody(body)
  if (signature.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

function encodeSignedPayload(payload: Record<string, unknown>): string {
  const body = JSON.stringify(payload)
  return `${Buffer.from(body).toString('base64url')}.${signBody(body)}`
}

function decodeSignedPayload<T extends { exp: number }>(token: string): T | null {
  const dot = token.indexOf('.')
  if (dot <= 0) return null

  const bodyB64 = token.slice(0, dot)
  const signature = token.slice(dot + 1)
  if (!bodyB64 || !signature) return null

  let body: string
  try {
    body = Buffer.from(bodyB64, 'base64url').toString('utf8')
  } catch {
    return null
  }

  if (!verifySignature(body, signature)) return null

  try {
    const payload = JSON.parse(body) as T
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function createVisitorToken(
  payload: Omit<VisitorTokenPayload, 'exp'>,
  ttlSec = 60 * 60 * 24 * 7
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec
  return encodeSignedPayload({ ...payload, exp })
}

export function resolveVisitorToken(token: string): VisitorTokenPayload | null {
  const signed = decodeSignedPayload<VisitorTokenPayload>(token)
  if (signed?.visitorId && signed.websiteId && signed.sessionId) {
    return signed
  }

  // Legacy unsigned token — reject in production
  if (process.env.NODE_ENV === 'production') return null

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8')) as Partial<VisitorTokenPayload>
    if (!decoded.visitorId || !decoded.websiteId) return null
    return {
      visitorId: decoded.visitorId,
      websiteId: decoded.websiteId,
      sessionId: decoded.sessionId || '',
      exp: decoded.exp || Math.floor(Date.now() / 1000) + 3600,
    }
  } catch {
    return null
  }
}

export function createAgentSocketToken(
  userId: string,
  scope?: 'platform' | 'tenant',
  ttlSec = 300
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec
  return encodeSignedPayload({ userId, scope, exp })
}

export function resolveAgentSocketToken(token: string): AgentSocketTokenPayload | null {
  const payload = decodeSignedPayload<AgentSocketTokenPayload>(token)
  if (!payload?.userId) return null
  return payload
}
