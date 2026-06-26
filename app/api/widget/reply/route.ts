import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { findWebsiteForWidget } from '@/lib/website-widget-safe'
import { isPlatformMarketingWebsiteId } from '@/lib/marketing-website'
import { runMarketingWidgetReply } from '@/lib/marketing-widget-reply'
import { rateLimitByIp, rateLimitResponse } from '@/lib/rate-limit'

export const maxDuration = 30

const bodySchema = z.object({
  websiteId: z.string(),
  conversationId: z.string(),
  fingerprint: z.string().min(8).max(128),
})

/**
 * Streaming endpoint'i çalışmazsa istemcinin başvurduğu garantili yanıt yolu.
 * Mevcut, denenmiş runMarketingWidgetReply'ı kullanır (idempotent — aynı
 * ziyaretçi mesajına ikinci kez yanıt üretmez).
 */
export async function POST(req: Request) {
  const limited = rateLimitByIp(req, 'widget-reply', 120, 60_000)
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
  }

  const website = await findWebsiteForWidget(parsed.websiteId)
  if (!website) {
    return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
  }
  if (!(await isPlatformMarketingWebsiteId(website.websiteId))) {
    return new NextResponse(null, { status: 204 })
  }

  const visitor = await prisma.visitor.findUnique({
    where: {
      websiteId_fingerprint: { websiteId: website.id, fingerprint: parsed.fingerprint },
    },
    select: { id: true },
  })
  if (!visitor) {
    return NextResponse.json({ error: 'Ziyaretçi bulunamadı' }, { status: 404 })
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: parsed.conversationId, websiteId: website.id, visitorId: visitor.id },
    select: { id: true },
  })
  if (!conversation) {
    return NextResponse.json({ error: 'Konuşma bulunamadı' }, { status: 404 })
  }

  const lastVisitor = await prisma.message.findFirst({
    where: { conversationId: conversation.id, senderType: 'VISITOR' },
    orderBy: { createdAt: 'desc' },
    select: { content: true, createdAt: true },
  })

  try {
    const aiReply = await runMarketingWidgetReply({
      websiteDbId: website.id,
      websitePublicId: website.websiteId,
      conversationId: conversation.id,
      visitorId: visitor.id,
      visitorMessage: lastVisitor?.content?.trim() || '',
      since: lastVisitor?.createdAt ?? new Date(Date.now() - 60_000),
    })
    return NextResponse.json({ aiReply }, { status: 200 })
  } catch (err) {
    console.error('[widget/reply] fallback failed:', err)
    return NextResponse.json({ error: 'Yanıt üretilemedi' }, { status: 500 })
  }
}
