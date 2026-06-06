import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

async function authorizeWebhook(webhookId: string, userId: string) {
  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
    include: { events: true },
  })
  if (!webhook) return { error: 'Webhook bulunamadı', status: 404 as const }

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: webhook.websiteId, userId, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) return { error: 'Erişim reddedildi', status: 403 as const }

  return { webhook }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { id } = await params
  const result = await authorizeWebhook(id, session.user.id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const body = await req.json().catch(() => ({}))
  const updated = await prisma.webhook.update({
    where: { id },
    data: { isActive: typeof body.isActive === 'boolean' ? body.isActive : result.webhook.isActive },
    include: { events: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { id } = await params
  const result = await authorizeWebhook(id, session.user.id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  await prisma.webhook.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

// POST → send a signed test payload to the webhook endpoint
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { id } = await params
  const result = await authorizeWebhook(id, session.user.id)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const webhook = result.webhook
  const body = JSON.stringify({
    event: 'webhook.test',
    timestamp: new Date().toISOString(),
    data: { message: 'Bu bir test webhook isteğidir.' },
  })

  const signature = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex')

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gu-Signature': signature,
        'X-Gu-Event': 'webhook.test',
      },
      body,
      signal: AbortSignal.timeout(10000),
    })

    if (res.ok) {
      await prisma.webhook.update({
        where: { id },
        data: { lastTriggeredAt: new Date(), failureCount: 0 },
      })
      return NextResponse.json({ success: true, status: res.status })
    }

    await prisma.webhook.update({
      where: { id },
      data: { failureCount: { increment: 1 } },
    })
    return NextResponse.json(
      { success: false, status: res.status, error: `Uç nokta ${res.status} döndürdü` },
      { status: 200 }
    )
  } catch {
    await prisma.webhook.update({
      where: { id },
      data: { failureCount: { increment: 1 } },
    })
    return NextResponse.json(
      { success: false, error: 'Webhook adresine ulaşılamadı (zaman aşımı veya bağlantı hatası)' },
      { status: 200 }
    )
  }
}
