import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { handleInboundChannelMessage } from '@/lib/channel-inbound'
import { websiteHasFeature } from '@/lib/addon-features'
import { parseTwilioSmsPayload, type SmsConfig } from '@/lib/channels/sms'

function verifySmsSecret(request: NextRequest, cfg: SmsConfig): boolean {
  const expected = cfg.webhookSecret?.trim()
  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[SMS Webhook] webhookSecret not configured — rejecting POST')
      return false
    }
    return true
  }
  const header = request.headers.get('x-gu-webhook-secret')
  if (!header) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected))
  } catch {
    return false
  }
}

async function parseBody(req: NextRequest): Promise<Record<string, string>> {
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const json = (await req.json()) as Record<string, string>
    return json
  }
  const form = await req.formData()
  const out: Record<string, string> = {}
  form.forEach((value, key) => {
    out[key] = String(value)
  })
  return out
}

export async function POST(request: NextRequest) {
  try {
    const websitePublicId = request.nextUrl.searchParams.get('websiteId')
    if (!websitePublicId) {
      return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
    }

    const website = await prisma.website.findUnique({
      where: { websiteId: websitePublicId },
      select: { id: true, websiteId: true, plan: true },
    })
    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const integration = await prisma.channelIntegration.findUnique({
      where: { websiteId_type: { websiteId: website.id, type: 'SMS' } },
    })
    if (!integration?.isActive) {
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    if (!(await websiteHasFeature(website.id, website.plan, 'multiChannel'))) {
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    let cfg: SmsConfig = { accountSid: '', authToken: '', phoneNumber: '' }
    try {
      cfg = JSON.parse(integration.config || '{}') as SmsConfig
    } catch {
      return NextResponse.json({ error: 'Invalid integration config' }, { status: 400 })
    }

    if (!verifySmsSecret(request, cfg)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const payload = await parseBody(request)
    const msg = parseTwilioSmsPayload(payload)
    if (!msg) {
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    await handleInboundChannelMessage({
      websiteDbId: website.id,
      websitePublicId: website.websiteId,
      fingerprint: `sms_${msg.from}`,
      visitorName: msg.from,
      content: msg.text,
      source: 'SMS' as never,
    })

    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('[SMS Webhook] Error:', error)
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}

export async function GET(request: NextRequest) {
  const websitePublicId = request.nextUrl.searchParams.get('websiteId')
  const base = process.env.NEXTAUTH_URL || 'https://your-domain.com'
  if (!websitePublicId) {
    return NextResponse.json({
      hint: 'Webhook URL: /api/webhooks/sms?websiteId=YOUR_WEBSITE_ID',
      note: 'Twilio Messaging webhook POST. İsteğe bağlı X-Gu-Webhook-Secret header için kanal ayarlarındaki webhookSecret kullanın.',
    })
  }

  return NextResponse.json({
    webhookUrl: `${base}/api/webhooks/sms?websiteId=${websitePublicId}`,
    instructions:
      'Twilio Console > Phone Numbers > Messaging webhook URL. Form POST beklenir. Güvenlik için webhookSecret tanımlayıp Twilio Studio/Function ile X-Gu-Webhook-Secret header ekleyin.',
  })
}
