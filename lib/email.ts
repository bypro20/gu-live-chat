// ─── Email Sending Abstraction ────────────────────────────────────
//
// Supports multiple providers:
// - Resend (https://resend.com) — recommended for production
// - SMTP — fallback for self-hosted
// - Console — development only (logs to console)
//
// Environment variables:
//   EMAIL_PROVIDER=resend|smtp|console  (default: console)
//   RESEND_API_KEY=re_xxxxx             (for Resend)
//   SMTP_HOST=smtp.example.com
//   SMTP_PORT=587
//   SMTP_USER=
//   SMTP_PASS=
//   SMTP_FROM=noreply@gulive.com

type EmailProvider = 'resend' | 'smtp' | 'console'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

// ─── Get Provider ──────────────────────────────────────────────────

export function isEmailConfigured(): boolean {
  if (process.env.RESEND_API_KEY?.trim()) return true
  if (process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim()) return true
  return false
}

function getProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER as EmailProvider
  if (provider === 'resend' || provider === 'smtp' || provider === 'console') {
    return provider
  }
  if (process.env.RESEND_API_KEY) return 'resend'
  if (process.env.SMTP_HOST) return 'smtp'
  return 'console'
}

const DEFAULT_FROM =
  process.env.EMAIL_FROM ||
  process.env.SMTP_FROM ||
  'Gu Live Chat <noreply@gulivechat.com>'

// ─── Send Email ────────────────────────────────────────────────────

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = getProvider()

  const from = options.from || DEFAULT_FROM
  const to = Array.isArray(options.to) ? options.to : [options.to]

  switch (provider) {
    case 'resend':
      return sendWithResend({ ...options, from, to })
    case 'smtp':
      return sendWithSMTP({ ...options, from, to })
    case 'console':
    default:
      return sendWithConsole({ ...options, from, to })
  }
}

// ─── Resend Provider ──────────────────────────────────────────────

async function sendWithResend(options: Required<Omit<EmailOptions, 'text'>> & { to: string[]; text?: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[Email] Resend error:', data)
      return { success: false, error: data.message || 'Resend API error' }
    }

    return { success: true, messageId: data.id }
  } catch (error) {
    console.error('[Email] Resend request failed:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// ─── SMTP Provider ─────────────────────────────────────────────────

async function sendWithSMTP(options: Required<Omit<EmailOptions, 'text'>> & { to: string[]; text?: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // SMTP requires nodemailer — dynamic import to avoid bundling when not needed
  try {
    const nodemailer = await import('nodemailer')

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const result = await transporter.sendMail({
      from: options.from,
      to: options.to.join(', '),
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('[Email] SMTP error:', error)
    return { success: false, error: 'SMTP send failed' }
  }
}

// ─── Console Provider (Development) ────────────────────────────────

async function sendWithConsole(options: Required<Omit<EmailOptions, 'text'>> & { to: string[]; text?: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 EMAIL SENT')
  console.log(`   From: ${options.from}`)
  console.log(`   To: ${options.to.join(', ')}`)
  console.log(`   Subject: ${options.subject}`)
  console.log(`   Text: ${options.text || '(no text version)'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  return { success: true, messageId: `console-${Date.now()}` }
}

// ─── Email Templates ───────────────────────────────────────────────

export function newConversationEmail(data: {
  visitorName: string
  websiteName: string
  conversationUrl: string
}): EmailOptions {
  return {
    to: '', // Will be set by caller
    subject: `Yeni konuşma: ${data.visitorName} - ${data.websiteName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1972F5; font-size: 20px; margin: 0;">GU Live Chat</h1>
          </div>
          <h2 style="color: #111827; font-size: 18px; margin-bottom: 8px;">Yeni konuşma başlatıldı</h2>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            <strong style="color: #111827;">${data.visitorName}</strong>, <strong>${data.websiteName}</strong> sitesinde yeni bir konuşma başlattı.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.conversationUrl}" style="background: #1972F5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Konuşmayı Aç
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            Bu e-posta GU Live Chat tarafından gönderilmiştir.
          </p>
        </div>
      </div>
    `,
    text: `Yeni konuşma: ${data.visitorName} - ${data.websiteName}\n\nKonuşmayı aç: ${data.conversationUrl}`,
  }
}

export function teamInviteEmail(data: {
  inviterName: string
  websiteName: string
  acceptUrl: string
}): EmailOptions {
  return {
    to: '', // Will be set by caller
    subject: `${data.inviterName} sizi ${data.websiteName} takımına davet etti`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1972F5; font-size: 20px; margin: 0;">GU Live Chat</h1>
          </div>
          <h2 style="color: #111827; font-size: 18px; margin-bottom: 8px;">Takım Daveti</h2>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            <strong style="color: #111827;">${data.inviterName}</strong> sizi <strong>${data.websiteName}</strong> sitesinin canlı destek takımına davet etti.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.acceptUrl}" style="background: #1972F5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Daveti Kabul Et
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            Bu e-posta GU Live Chat tarafından gönderilmiştir. Davet size ulaşmadıysa bu e-postayı görmezden gelebilirsiniz.
          </p>
        </div>
      </div>
    `,
    text: `${data.inviterName} sizi ${data.websiteName} takımına davet etti\n\nDaveti kabul et: ${data.acceptUrl}`,
  }
}

export function trialExpiringEmail(data: {
  daysLeft: number
  websiteName: string
  billingUrl: string
}): EmailOptions {
  return {
    to: '', // Will be set by caller
    subject: `Deneme sürenizin dolmasına ${data.daysLeft} gün kaldı - ${data.websiteName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1972F5; font-size: 20px; margin: 0;">GU Live Chat</h1>
          </div>
          <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
            <p style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0;">⏰ Deneme sürenizin dolmasına ${data.daysLeft} gün kaldı!</p>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            <strong>${data.websiteName}</strong> sitenizin PRO plan deneme süresi yakında sona erecek. Deneme süresi bittiğinde hesabınız ücretsiz plana dönecektir.
          </p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Tüm PRO özelliklerini kaybetmemek için şimdi yükseltin:
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.billingUrl}" style="background: #1972F5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Planı Yükselt
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            Bu e-posta GU Live Chat tarafından gönderilmiştir.
          </p>
        </div>
      </div>
    `,
    text: `Deneme sürenizin dolmasına ${data.daysLeft} gün kaldı!\n\n${data.websiteName} sitenizin PRO plan deneme süresi yakında sona erecek.\n\nYükseltmek için: ${data.billingUrl}`,
  }
}

export function paymentSuccessEmail(data: {
  planName: string
  amount: string
  periodEnd: string
  websiteName: string
  billingUrl: string
}): EmailOptions {
  return {
    to: '',
    subject: `Ödeme başarılı - ${data.planName} planı - ${data.websiteName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1972F5; font-size: 20px; margin: 0;">GU Live Chat</h1>
          </div>
          <div style="background: #d1fae5; border: 1px solid #34d399; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
            <p style="color: #065f46; font-size: 16px; font-weight: 600; margin: 0;">✅ Ödeme başarıyla tamamlandı!</p>
          </div>
          <h2 style="color: #111827; font-size: 18px; margin-bottom: 12px;">Ödeme Detayları</h2>
          <table style="width: 100%; font-size: 14px; color: #6b7280;">
            <tr><td style="padding: 8px 0; font-weight: 500; color: #111827;">Plan:</td><td style="padding: 8px 0;">${data.planName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 500; color: #111827;">Tutar:</td><td style="padding: 8px 0;">${data.amount}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 500; color: #111827;">Dönem sonu:</td><td style="padding: 8px 0;">${data.periodEnd}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: 500; color: #111827;">Site:</td><td style="padding: 8px 0;">${data.websiteName}</td></tr>
          </table>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.billingUrl}" style="background: #1972F5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Faturalandırma Sayfası
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            Bu e-posta GU Live Chat tarafından gönderilmiştir.
          </p>
        </div>
      </div>
    `,
    text: `Ödeme başarılı - ${data.planName}\n\nTutar: ${data.amount}\nDönem sonu: ${data.periodEnd}\nSite: ${data.websiteName}\n\nFaturalandırma: ${data.billingUrl}`,
  }
}

export function paymentFailedEmail(data: {
  websiteName: string
  billingUrl: string
}): EmailOptions {
  return {
    to: '',
    subject: `Ödeme başarısız - ${data.websiteName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1972F5; font-size: 20px; margin: 0;">GU Live Chat</h1>
          </div>
          <div style="background: #fee2e2; border: 1px solid #f87171; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
            <p style="color: #991b1b; font-size: 16px; font-weight: 600; margin: 0;">⚠️ Ödeme alınamadı</p>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            <strong>${data.websiteName}</strong> sitenizin plan ödemesi gerçekleştirilemedi. Lütfen ödeme bilgilerinizi kontrol edin.
          </p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            3 başarısız ödeme denemesinden sonra hesabınız ücretsiz plana dönecektir.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${data.billingUrl}" style="background: #1972F5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Ödeme Bilgilerini Güncelle
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
            Bu e-posta GU Live Chat tarafından gönderilmiştir.
          </p>
        </div>
      </div>
    `,
    text: `Ödeme başarısız - ${data.websiteName}\n\nLütfen ödeme bilgilerinizi kontrol edin: ${data.billingUrl}`,
  }
}