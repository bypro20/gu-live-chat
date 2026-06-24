import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { getAdminMailMessage, updateAdminMailMessage } from '@/lib/admin-mail-inbox'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { escapeHtml } from '@/lib/html-escape'
import { getSupportEmail } from '@/lib/site-config'

const SUPPORT_FROM = `Gu Live Chat <${getSupportEmail()}>`

const replySchema = z.object({
  body: z.string().min(1).max(10000),
})

/** POST /api/admin/mail/[id]/reply */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin()
  if (check.error) return check.error

  const { id } = await params
  const message = await getAdminMailMessage(id)
  if (!message) {
    return NextResponse.json({ error: 'Mail bulunamadı' }, { status: 404 })
  }

  if (!message.fromEmail) {
    return NextResponse.json({ error: 'Gönderici e-postası yok — yanıt gönderilemez' }, { status: 400 })
  }

  const parsed = replySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz yanıt metni' }, { status: 400 })
  }

  const { body } = parsed.data

  if (isEmailConfigured()) {
    const result = await sendEmail({
      to: message.fromEmail,
      from: SUPPORT_FROM,
      subject: `Re: ${message.subject}`,
      text: body,
      html: `<p>${escapeHtml(body).replace(/\n/g, '<br>')}</p><hr><p style="color:#888;font-size:12px">Gu Live Chat destek yanıtı</p>`,
    })
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'E-posta gönderilemedi' }, { status: 500 })
    }
  }

  const updated = await updateAdminMailMessage(id, {
    replyBody: body,
    repliedAt: new Date().toISOString(),
    status: 'read',
  })

  return NextResponse.json({
    message: updated,
    emailed: isEmailConfigured(),
    note: isEmailConfigured() ? undefined : 'Yanıt kaydedildi (RESEND/SMTP yapılandırılmamış — e-posta gitmedi)',
  })
}
