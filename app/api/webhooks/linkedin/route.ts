import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { parseLinkedInWebhook } from '@/lib/channels/linkedin'
import { handleInboundChannelMessage } from '@/lib/channel-inbound'
import { websiteHasFeature } from '@/lib/addon-features'
import type { LinkedInConfig } from '@/lib/channels/linkedin'

function verifyLinkedInSecret(req: NextRequest, cfg: LinkedInConfig): boolean {
  const expected = cfg.webhookSecret?.trim()
  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[LinkedIn Webhook] webhookSecret not configured — rejecting POST')
      return false
    }
    return true
  }
  const header = req.headers.get('x-gu-webhook-secret')
  if (!header) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected))
  } catch {
    return false
  }
}

/** POST /api/webhooks/linkedin?websiteId= — LinkedIn / custom messaging webhook */
export async function POST(req: NextRequest) {
  const websitePublicId = req.nextUrl.searchParams.get('websiteId')
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
    where: { websiteId_type: { websiteId: website.id, type: 'LINKEDIN' as import('@/app/generated/prisma/client').ChannelType } },
  })
  if (!integration?.isActive) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  if (!(await websiteHasFeature(website.id, website.plan, 'multiChannel'))) {
    return NextResponse.json({ ok: true, plan_denied: true })
  }

  let cfg: LinkedInConfig = { accessToken: '', organizationId: '' }
  try {
    cfg = JSON.parse(integration.config || '{}') as LinkedInConfig
  } catch {
    return NextResponse.json({ error: 'Invalid integration config' }, { status: 400 })
  }

  if (!verifyLinkedInSecret(req, cfg)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const msg = parseLinkedInWebhook(body)
  if (!msg) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  await handleInboundChannelMessage({
    websiteDbId: website.id,
    websitePublicId: website.websiteId,
    fingerprint: `li_${msg.senderId}`,
    content: msg.text,
    source: 'LINKEDIN' as never,
  })

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const websitePublicId = req.nextUrl.searchParams.get('websiteId')
  const base = process.env.NEXTAUTH_URL || 'https://your-domain.com'
  if (!websitePublicId) {
    return NextResponse.json({
      ok: true,
      webhook: '/api/webhooks/linkedin',
      hint: 'POST { senderId, text } veya LinkedIn webhook payload. X-Gu-Webhook-Secret header önerilir.',
    })
  }

  return NextResponse.json({
    webhookUrl: `${base}/api/webhooks/linkedin?websiteId=${websitePublicId}`,
    instructions:
      'LinkedIn Developer webhook veya middleware POST. Güvenlik için kanal ayarlarındaki webhookSecret ile X-Gu-Webhook-Secret header eşleşmeli.',
  })
}
