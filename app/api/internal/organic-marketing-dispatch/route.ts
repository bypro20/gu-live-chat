import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron-auth'
import { createAdminMailMessage } from '@/lib/admin-mail-inbox'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { getMailNotifyTo } from '@/lib/site-config'

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
  taskId?: string
}

/** POST — organik pazarlama webhook → admin mail kutusu */
export async function POST(request: NextRequest) {
  const authError = verifyCronRequest(request)
  if (authError) return authError

  let payload: DispatchPayload
  try {
    payload = (await request.json()) as DispatchPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const channel = payload.channel ?? 'social'
  const subject = `[${channel.toUpperCase()}] ${payload.title ?? 'Organik içerik'} — ${payload.date ?? ''}`
  const text =
    payload.text ||
    [payload.title, payload.hook, payload.body, payload.cta, payload.landingUrl]
      .filter(Boolean)
      .join('\n\n')

  const message = await createAdminMailMessage({
    source: 'organic-marketing',
    fromName: 'Pazarlama Botu',
    fromEmail: null,
    subject,
    body: text,
    metadata: {
      channel,
      type: payload.type,
      taskId: payload.taskId,
      landingUrl: payload.landingUrl,
      hashtags: payload.hashtags,
    },
  })

  const notifyTo = getMailNotifyTo()
  let emailed = false
  if (isEmailConfigured() && notifyTo) {
    const result = await sendEmail({
      to: notifyTo,
      subject,
      text,
      html: `
        <h2>${payload.title ?? 'Organik içerik'}</h2>
        ${payload.hook ? `<p><em>${payload.hook}</em></p>` : ''}
        ${payload.body ? `<p>${payload.body.replace(/\n/g, '<br>')}</p>` : ''}
        ${payload.cta ? `<p><strong>${payload.cta}</strong></p>` : ''}
        ${payload.landingUrl ? `<p><a href="${payload.landingUrl}">${payload.landingUrl}</a></p>` : ''}
        <hr><pre style="white-space:pre-wrap">${text}</pre>
        <p style="color:#888;font-size:12px">Admin panel → E-posta Merkezi (/admin/mail)</p>
      `,
    })
    emailed = result.success
  }

  return NextResponse.json({ ok: true, messageId: message.id, emailed, adminMail: true })
}
