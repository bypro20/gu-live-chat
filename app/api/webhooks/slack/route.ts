import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

function verifySlackSignature(
  signingSecret: string,
  signature: string | null,
  timestamp: string | null,
  rawBody: string
): boolean {
  if (!signature?.startsWith('v0=') || !timestamp) return false

  const ageSec = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(ageSec) || ageSec > 60 * 5) return false

  const base = `v0:${timestamp}:${rawBody}`
  const digest = crypto.createHmac('sha256', signingSecret).update(base).digest('hex')
  const expected = `v0=${digest}`

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signingSecret = process.env.SLACK_SIGNING_SECRET?.trim()

  if (process.env.NODE_ENV === 'production' && !signingSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  if (signingSecret) {
    const ok = verifySlackSignature(
      signingSecret,
      req.headers.get('x-slack-signature'),
      req.headers.get('x-slack-request-timestamp'),
      rawBody
    )
    if (!ok) {
      return NextResponse.json({ error: 'Geçersiz imza' }, { status: 401 })
    }
  }

  let body: { type?: string; challenge?: string; event?: { type?: string } }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Gecersiz govde' }, { status: 400 })
  }

  if (body.type === 'url_verification' && body.challenge) {
    return NextResponse.json({ challenge: body.challenge })
  }

  if (body.event?.type) {
    console.log('[Slack webhook]', body.type, body.event.type)
  }

  return NextResponse.json({ ok: true })
}
