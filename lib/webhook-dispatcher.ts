import crypto from 'crypto'
import { prisma } from './db'

export type WebhookEventName =
  | 'conversation.created'
  | 'conversation.resolved'
  | 'conversation.closed'
  | 'message.sent'
  | 'message.received'
  | 'visitor.created'
  | 'visitor.updated'
  | 'team.member.added'
  | 'team.member.removed'

export async function dispatchWebhooks(
  websiteId: string,
  event: WebhookEventName,
  payload: Record<string, unknown>
) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      websiteId,
      isActive: true,
      events: { some: { event } },
    },
    include: { events: true },
  })

  if (webhooks.length === 0) return

  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  })

  await Promise.allSettled(
    webhooks.map(async (webhook) => {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex')

      try {
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Gu-Signature': signature,
            'X-Gu-Event': event,
          },
          body,
          signal: AbortSignal.timeout(10000),
        })

        if (res.ok) {
          await prisma.webhook.update({
            where: { id: webhook.id },
            data: { lastTriggeredAt: new Date(), failureCount: 0 },
          })
        } else {
          await prisma.webhook.update({
            where: { id: webhook.id },
            data: { failureCount: { increment: 1 } },
          })
          console.error(`[Webhook] ${webhook.url} returned ${res.status}`)
        }
      } catch (err) {
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: { failureCount: { increment: 1 } },
        })
        console.error(`[Webhook] Failed to dispatch to ${webhook.url}:`, err)
      }
    })
  )
}
