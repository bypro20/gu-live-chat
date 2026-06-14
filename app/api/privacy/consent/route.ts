import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getClientIp } from '@/lib/ip-utils'
import { rateLimitByIp, rateLimitResponse } from '@/lib/rate-limit'

const consentSchema = z.object({
  websiteId: z.string().min(1).max(64),
  visitorId: z.string().max(128).optional().nullable(),
  consentType: z.enum(['GDPR', 'KVKK', 'COOKIE', 'DATA_PROCESSING']).default('GDPR'),
  granted: z.boolean().default(false),
  ipAddress: z.string().max(64).optional().nullable(),
  userAgent: z.string().max(512).optional().nullable(),
})

export async function POST(req: Request) {
  const limited = rateLimitByIp(req, 'privacy-consent', 30, 60_000)
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

  try {
    const body = await req.json()
    const parsed = consentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
    }

    const { websiteId, visitorId, consentType, granted, userAgent } = parsed.data
    const clientIp = getClientIp(req)

    const website = await prisma.website.findUnique({ where: { websiteId } })
    if (!website) {
      return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })
    }

    const consent = await prisma.gDPRConsent.create({
      data: {
        websiteId: website.id,
        visitorId: visitorId || null,
        consentType,
        granted,
        ipAddress: clientIp,
        userAgent: userAgent || null,
      },
      select: { id: true, granted: true, consentType: true, grantedAt: true },
    })

    return NextResponse.json(consent, { status: 201 })
  } catch (error: unknown) {
    console.error('Consent log error:', error)
    return NextResponse.json({ error: 'Onay kaydedilemedi' }, { status: 500 })
  }
}
