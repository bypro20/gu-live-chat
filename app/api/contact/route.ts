import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { notifyAdminsOfContact } from '@/lib/contact-inbox'
import { rateLimitByIp, rateLimitResponse } from '@/lib/rate-limit'

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
})

export async function POST(req: Request) {
  try {
    const limited = rateLimitByIp(req, 'contact', 5, 60_000)
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

    const body = await req.json()
    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz form verisi' }, { status: 400 })
    }

    const { name, email, subject, message } = parsed.data
    const to = process.env.CONTACT_EMAIL || process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || 'destek@gulivechat.com'

    let emailDelivered = false
    if (isEmailConfigured()) {
      const html = `
        <h2>Gu Live Chat — İletişim Formu</h2>
        <p><strong>Ad:</strong> ${name}</p>
        <p><strong>E-posta:</strong> ${email}</p>
        <p><strong>Konu:</strong> ${subject}</p>
        <p><strong>Mesaj:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
      const result = await sendEmail({
        to,
        subject: `[İletişim] ${subject} — ${name}`,
        html,
        text: `${name} <${email}>\n${subject}\n\n${message}`,
      })
      emailDelivered = result.success
    }

    await notifyAdminsOfContact({ name, email, subject, message })

    return NextResponse.json({
      success: true,
      delivered: emailDelivered,
      note: emailDelivered
        ? undefined
        : 'Mesajınız admin paneline iletildi (e-posta yapılandırması bekleniyor).',
    })
  } catch (error) {
    console.error('[Contact]', error)
    return NextResponse.json({ error: 'Mesaj gönderilemedi' }, { status: 500 })
  }
}
