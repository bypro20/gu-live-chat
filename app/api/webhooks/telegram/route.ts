import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { handleInboundChannelMessage } from '@/lib/channel-inbound'
import { websiteHasFeature } from '@/lib/addon-features'
import type { TelegramConfig } from '@/lib/channels/telegram'

function verifyTelegramSecret(request: NextRequest, cfg: TelegramConfig): boolean {
  const header = request.headers.get('x-telegram-bot-api-secret-token')
  const expected = cfg.webhookSecret?.trim()
  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Telegram Webhook] webhookSecret not configured — rejecting POST')
      return false
    }
    return true
  }
  if (!header) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected))
  } catch {
    return false
  }
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
      where: { websiteId_type: { websiteId: website.id, type: 'TELEGRAM' } },
    })
    if (!integration?.isActive) {
      return NextResponse.json({ status: 'no_integration' })
    }

    if (!(await websiteHasFeature(website.id, website.plan, 'multiChannel'))) {
      return NextResponse.json({ status: 'plan_denied' })
    }

    let cfg: TelegramConfig = { botToken: '' }
    try {
      cfg = JSON.parse(integration.config || '{}') as TelegramConfig
    } catch {
      return NextResponse.json({ error: 'Invalid integration config' }, { status: 400 })
    }

    if (!verifyTelegramSecret(request, cfg)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const message = body?.message
    if (!message?.chat?.id || !message.text) {
      return NextResponse.json({ status: 'ignored' })
    }

    const chatId = String(message.chat.id)
    const content = message.text as string
    const name = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ') || chatId

    await handleInboundChannelMessage({
      websiteDbId: website.id,
      websitePublicId: website.websiteId,
      fingerprint: `tg_${chatId}`,
      visitorName: name,
      content,
      source: 'TELEGRAM',
    })

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[Telegram Webhook] Error:', error)
    return NextResponse.json({ status: 'error' }, { status: 200 })
  }
}

/** Telegram does not use GET verification; expose setup hint via GET. */
export async function GET(request: NextRequest) {
  const websitePublicId = request.nextUrl.searchParams.get('websiteId')
  if (!websitePublicId) {
    return NextResponse.json({
      hint: 'Webhook URL: /api/webhooks/telegram?websiteId=YOUR_WEBSITE_ID',
      note: 'setWebhook çağrısında secret_token parametresi kullanın; değeri kanal ayarlarındaki webhookSecret ile eşleşmeli.',
    })
  }

  const website = await prisma.website.findUnique({
    where: { websiteId: websitePublicId },
    select: { id: true },
  })
  if (!website) return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })

  const integration = await prisma.channelIntegration.findUnique({
    where: { websiteId_type: { websiteId: website.id, type: 'TELEGRAM' } },
  })
  if (!integration?.config) {
    return NextResponse.json({ error: 'Telegram kanalı yapılandırılmamış' }, { status: 404 })
  }

  const base = process.env.NEXTAUTH_URL || 'https://your-domain.com'
  const webhookUrl = `${base}/api/webhooks/telegram?websiteId=${websitePublicId}`

  return NextResponse.json({
    webhookUrl,
    instructions:
      'Telegram setWebhook URL\'ine secret_token ekleyin. Panelde kayıtlı webhookSecret ile aynı olmalı. Bot token asla bu yanıtta gösterilmez.',
  })
}
