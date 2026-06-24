import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron-auth'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { getSupportEmail } from '@/lib/site-config'

type DispatchPayload = {
  channel?: string
  type?: string
  date?: string
  title?: string
  hook?: string
  body?: string
  cta?: string
  text?: string
  landingUrl?: string
  hashtags?: string[]
}

/** POST — organik pazarlama webhook (Vercel env ORGANIC_MARKETING_WEBHOOK_URL) */
export async function POST(request: NextRequest) {
  const authError = verifyCronRequest(request)
  if (authError) return authError

  let payload: DispatchPayload
  try {
    payload = (await request.json()) as DispatchPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const to = process.env.ORGANIC_MARKETING_NOTIFY_EMAIL?.trim() || getSupportEmail()
  if (!isEmailConfigured()) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'Email not configured' })
  }

  const channel = payload.channel?.toUpperCase() ?? 'SOCIAL'
  const subject = `[Gu Live Chat] ${channel} içeriği — ${payload.date ?? 'bugün'}`
  const text =
    payload.text ||
    [payload.title, payload.hook, payload.body, payload.cta, payload.landingUrl]
      .filter(Boolean)
      .join('\n\n')

  const result = await sendEmail({
    to,
    subject,
    text,
    html: `
      <h2>${payload.title ?? 'Organik içerik'}</h2>
      ${payload.hook ? `<p><em>${payload.hook}</em></p>` : ''}
      ${payload.body ? `<p>${payload.body.replace(/\n/g, '<br>')}</p>` : ''}
      ${payload.cta ? `<p><strong>${payload.cta}</strong></p>` : ''}
      ${payload.landingUrl ? `<p><a href="${payload.landingUrl}">${payload.landingUrl}</a></p>` : ''}
      <hr><pre style="white-space:pre-wrap">${text}</pre>
      <p style="color:#888;font-size:12px">Kanal: ${payload.channel ?? '-'} · Kopyalayıp ${payload.channel ?? 'sosyal medyaya'} paylaşın.</p>
    `,
  })

  if (!result.success) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, to, messageId: result.messageId })
}
