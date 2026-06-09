import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { handleInboundChannelMessage } from '@/lib/channel-inbound'
import { websiteHasFeature } from '@/lib/addon-features'
import type { TelegramConfig } from '@/lib/channels/telegram'

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

  let cfg: TelegramConfig = { botToken: '' }
  try {
    cfg = JSON.parse(integration.config) as TelegramConfig
  } catch { /* ignore */ }

  const base = process.env.NEXTAUTH_URL || 'https://your-domain.com'
  const webhookUrl = `${base}/api/webhooks/telegram?websiteId=${websitePublicId}`

  return NextResponse.json({
    webhookUrl,
    setWebhook: cfg.botToken
      ? `https://api.telegram.org/bot${cfg.botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
      : null,
  })
}
