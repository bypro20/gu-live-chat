import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getClientIp } from '@/lib/ip-utils'
import { isIpBanned } from '@/lib/ip-ban'
import { findWebsiteForWidget } from '@/lib/website-widget-safe'
import { validateVisitorIdentityInput, widgetIdentityRequired } from '@/lib/widget-identity'
import { rateLimitByIp, rateLimitResponse } from '@/lib/rate-limit'

const identifySchema = z.object({
  websiteId: z.string().min(1),
  fingerprint: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
  email: z.string().email().max(254),
})

export async function POST(req: Request) {
  try {
    const limited = rateLimitByIp(req, 'widget-identify', 30, 60_000)
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

    const clientIp = getClientIp(req)
    if (await isIpBanned(clientIp)) {
      return NextResponse.json({ error: 'Erişim engellendi' }, { status: 403 })
    }

    const body = await req.json()
    const validated = identifySchema.parse(body)

    const website = await findWebsiteForWidget(validated.websiteId)
    if (!website) {
      return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
    }

    if (!widgetIdentityRequired(website)) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const identityError = validateVisitorIdentityInput(
      website,
      validated.name,
      validated.email,
    )
    if (identityError) {
      return NextResponse.json({ error: identityError }, { status: 400 })
    }

    const name = validated.name.trim()
    const email = validated.email.trim().toLowerCase()

    const visitor = await prisma.visitor.upsert({
      where: {
        websiteId_fingerprint: {
          websiteId: website.id,
          fingerprint: validated.fingerprint,
        },
      },
      create: {
        websiteId: website.id,
        fingerprint: validated.fingerprint,
        name,
        email,
      },
      update: { name, email },
      select: { id: true, name: true, email: true },
    })

    return NextResponse.json({
      ok: true,
      visitor: { id: visitor.id, name: visitor.name, email: visitor.email },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Geçersiz bilgi — isim ve e-posta gerekli' }, { status: 400 })
    }
    console.error('[widget/identify]', error)
    return NextResponse.json({ error: 'Kayıt başarısız' }, { status: 500 })
  }
}
