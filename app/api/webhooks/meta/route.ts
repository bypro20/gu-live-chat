import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { handleInboundChannelMessage } from '@/lib/channel-inbound'
import { websiteHasFeature } from '@/lib/addon-features'
import type { MetaChannelConfig } from '@/lib/channels/meta'

function verifyMetaSignature(rawBody: string, signature: string | null, appSecret: string): boolean {
  if (!signature || !appSecret) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

type ChannelType = 'MESSENGER' | 'INSTAGRAM'

function parseMetaMessages(body: Record<string, unknown>): {
  senderId: string
  text: string
  pageId?: string
  channelType: ChannelType
}[] {
  const results: { senderId: string; text: string; pageId?: string; channelType: ChannelType }[] = []
  const entries = (body.entry as Record<string, unknown>[]) || []

  for (const entry of entries) {
    const pageId = entry.id as string | undefined

    for (const item of (entry.messaging as Record<string, unknown>[]) || []) {
      const senderId = (item.sender as { id?: string })?.id
      const text = (item.message as { text?: string })?.text
      if (senderId && text) {
        results.push({ senderId, text, pageId, channelType: 'MESSENGER' })
      }
    }

    for (const item of (entry.changes as Record<string, unknown>[]) || []) {
      if (item.field !== 'messages') continue
      const value = item.value as Record<string, unknown>
      const senderId = (value.sender as { id?: string })?.id
      const text = (value.message as { text?: string })?.text
      if (senderId && text) {
        results.push({ senderId, text, pageId, channelType: 'INSTAGRAM' })
      }
    }
  }

  return results
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode !== 'subscribe' || !challenge) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  const integrations = await prisma.channelIntegration.findMany({
    where: { type: { in: ['MESSENGER', 'INSTAGRAM'] }, isActive: true },
    select: { config: true },
  })

  const matched = integrations.some((i) => {
    try {
      const cfg = JSON.parse(i.config || '{}') as MetaChannelConfig
      return cfg.verifyToken === token
    } catch {
      return false
    }
  })

  if (!matched) return new NextResponse('Forbidden', { status: 403 })
  return new NextResponse(challenge, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-hub-signature-256')
    const appSecret = process.env.META_APP_SECRET?.trim() || ''

    if (process.env.NODE_ENV === 'production' && !appSecret) {
      console.error('[Meta Webhook] META_APP_SECRET missing in production')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
    }

    if (appSecret && !verifyMetaSignature(rawBody, signature, appSecret)) {
      console.warn('[Meta Webhook] Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const body = JSON.parse(rawBody)
    if (body.object !== 'page' && body.object !== 'instagram') {
      return NextResponse.json({ status: 'ignored' })
    }

    const messages = parseMetaMessages(body)
    if (messages.length === 0) {
      return NextResponse.json({ status: 'no_messages' })
    }

    for (const msg of messages) {
      const integrations = await prisma.channelIntegration.findMany({
        where: { type: msg.channelType, isActive: true },
        include: { website: true },
      })

      const integration = integrations.find((i) => {
        try {
          const cfg = JSON.parse(i.config || '{}') as MetaChannelConfig
          return !msg.pageId || cfg.pageId === msg.pageId
        } catch {
          return false
        }
      })

      if (!integration) continue

      if (!(await websiteHasFeature(integration.websiteId, integration.website.plan, 'multiChannel'))) {
        continue
      }

      const prefix = msg.channelType === 'MESSENGER' ? 'fb_' : 'ig_'
      await handleInboundChannelMessage({
        websiteDbId: integration.websiteId,
        websitePublicId: integration.website.websiteId,
        fingerprint: `${prefix}${msg.senderId}`,
        visitorName: msg.senderId,
        content: msg.text,
        source: msg.channelType === 'MESSENGER' ? 'MESSENGER' : 'INSTAGRAM',
      })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('[Meta Webhook] Error:', error)
    return NextResponse.json({ status: 'error' }, { status: 200 })
  }
}
