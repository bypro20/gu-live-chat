import { NextRequest, NextResponse } from 'next/server'

// Slack Events API iskeleti — imza dogrulama ve event loglama
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Gecersiz govde' }, { status: 400 })
  }

  if (body.type === 'url_verification' && body.challenge) {
    return NextResponse.json({ challenge: body.challenge })
  }

  // TODO: SLACK_SIGNING_SECRET ile imza dogrula, event -> bildirim
  console.log('[Slack webhook]', body.type || 'event', body.event?.type || '')

  return NextResponse.json({ ok: true })
}
