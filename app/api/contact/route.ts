import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz form verisi' }, { status: 400 })
    }

    const { name, email, subject, message } = parsed.data
    const to = process.env.CONTACT_EMAIL || process.env.EMAIL_FROM || 'destek@gulive.com'

    const html = `
      <h2>Gu Live Chat — İletişim Formu</h2>
      <p><strong>Ad:</strong> ${name}</p>
      <p><strong>E-posta:</strong> ${email}</p>
      <p><strong>Konu:</strong> ${subject}</p>
      <p><strong>Mesaj:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `

    await sendEmail({
      to,
      subject: `[İletişim] ${subject} — ${name}`,
      html,
      text: `${name} <${email}>\n${subject}\n\n${message}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Contact]', error)
    return NextResponse.json({ error: 'Mesaj gönderilemedi' }, { status: 500 })
  }
}
