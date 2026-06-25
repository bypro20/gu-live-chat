import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { rateLimitByIp, rateLimitResponse } from '@/lib/rate-limit'
import { resolveVisitorToken } from '@/lib/secure-tokens'
import { buildGpsGeoUpdate } from '@/lib/visitor-session-enrich'
import { emitVisitorGeoUpdate } from '@/lib/socket-events'

const geoSchema = z.object({
  websiteId: z.string(),
  sessionId: z.string(),
  visitorToken: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(),
})

export async function POST(req: Request) {
  try {
    const limited = rateLimitByIp(req, 'widget-geo', 20, 60_000)
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

    const body = await req.json()
    const validated = geoSchema.parse(body)

    const token = resolveVisitorToken(validated.visitorToken)
    if (!token || token.sessionId !== validated.sessionId) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    }

    const session = await prisma.visitorSession.findUnique({
      where: { sessionId: validated.sessionId },
      select: {
        id: true,
        visitorId: true,
        website: { select: { websiteId: true } },
      },
    })

    if (!session || session.visitorId !== token.visitorId) {
      return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })
    }

    if (session.website.websiteId !== validated.websiteId) {
      return NextResponse.json({ error: 'Site uyuşmuyor' }, { status: 403 })
    }

    const geo = await buildGpsGeoUpdate(
      validated.latitude,
      validated.longitude,
      validated.accuracy ?? null
    )

    await prisma.visitorSession.update({
      where: { sessionId: validated.sessionId },
      data: geo,
    })

    emitVisitorGeoUpdate({
      websiteId: validated.websiteId,
      visitorId: token.visitorId,
      ...geo,
    })

    return NextResponse.json({ ok: true, geoAddress: geo.geoAddress })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
    }
    console.error('[widget/geo]', error)
    return NextResponse.json({ error: 'Konum kaydedilemedi' }, { status: 500 })
  }
}
