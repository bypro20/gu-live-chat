import { lookupIpGeo } from '@/lib/geo'
import { prisma } from '@/lib/db'

export function enrichVisitorSessionGeoInBackground(
  sessionId: string,
  visitorId: string,
  clientIp: string | null | undefined,
) {
  void (async () => {
    const geo = await lookupIpGeo(clientIp)
    if (!geo) return

    const geoUpdate = {
      country: geo.country ?? null,
      city: geo.city ?? null,
      region: geo.region ?? null,
      district: geo.district ?? null,
      postalCode: geo.postalCode ?? null,
      latitude: geo.latitude ?? null,
      longitude: geo.longitude ?? null,
      timezone: geo.timezone ?? null,
      isp: geo.isp ?? null,
      geoAddress: geo.geoAddress ?? null,
      geoSource: geo.latitude != null ? ('ip' as const) : null,
    }

    try {
      await prisma.visitorSession.update({
        where: { sessionId },
        data: geoUpdate,
      })
    } catch {
      // Session row may use legacy columns — ignore.
    }

    try {
      await prisma.visitor.update({
        where: { id: visitorId },
        data: {
          ...(geo.country ? { country: geo.country } : {}),
          ...(geo.city ? { city: geo.city } : {}),
          ...(geo.timezone ? { timezone: geo.timezone } : {}),
        },
      })
    } catch {
      // Geo on visitor is optional.
    }
  })().catch(() => {})
}
