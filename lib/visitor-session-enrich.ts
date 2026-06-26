import { prisma } from '@/lib/db'
import { lookupIpGeo } from '@/lib/geo'
import { resolveEntrySource, type EntrySourceInput } from '@/lib/entry-source'
import { reverseGeocode } from '@/lib/reverse-geocode'
import { parseUserAgent } from '@/lib/user-agent'

export type VisitorSessionMetadata = {
  ipAddress: string | null
  userAgent: string | null
  browser: string | null
  os: string | null
  device: string | null
  deviceType: string | null
  country: string | null
  city: string | null
  region: string | null
  district: string | null
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  timezone: string | null
  isp: string | null
  geoAddress: string | null
  geoSource: 'ip' | null
  entrySource: ReturnType<typeof resolveEntrySource>
}

function buildVisitorSessionMetadataCore(input: {
  userAgent?: string | null
  clientIp?: string | null
  entry?: EntrySourceInput
}): VisitorSessionMetadata {
  const ua = parseUserAgent(input.userAgent || '')
  const entrySource = input.entry ? resolveEntrySource(input.entry) : null

  return {
    ipAddress: input.clientIp || null,
    userAgent: input.userAgent ?? null,
    browser: ua.browser,
    os: ua.os,
    device: ua.device,
    deviceType: ua.deviceType,
    country: null,
    city: null,
    region: null,
    district: null,
    postalCode: null,
    latitude: null,
    longitude: null,
    timezone: null,
    isp: null,
    geoAddress: null,
    geoSource: null,
    entrySource,
  }
}

/** Widget init hot path — IP geo lookup is deferred to keep panel open snappy. */
export function buildVisitorSessionMetadataFast(input: {
  userAgent?: string | null
  clientIp?: string | null
  entry?: EntrySourceInput
}): VisitorSessionMetadata {
  return buildVisitorSessionMetadataCore(input)
}

export async function buildVisitorSessionMetadata(input: {
  userAgent?: string | null
  clientIp?: string | null
  entry?: EntrySourceInput
}) {
  const core = buildVisitorSessionMetadataCore(input)
  const geo = await lookupIpGeo(input.clientIp)

  return {
    ...core,
    country: geo?.country ?? null,
    city: geo?.city ?? null,
    region: geo?.region ?? null,
    district: geo?.district ?? null,
    postalCode: geo?.postalCode ?? null,
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
    timezone: geo?.timezone ?? null,
    isp: geo?.isp ?? null,
    geoAddress: geo?.geoAddress ?? null,
    geoSource: geo?.latitude != null ? ('ip' as const) : null,
  }
}

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

export async function buildGpsGeoUpdate(lat: number, lng: number, accuracyMeters?: number | null) {
  const reversed = await reverseGeocode(lat, lng)
  const geoAddress =
    reversed?.geoAddress ||
    `${lat.toFixed(5)}, ${lng.toFixed(5)}${accuracyMeters ? ` (±${Math.round(accuracyMeters)}m)` : ''}`

  return {
    latitude: lat,
    longitude: lng,
    district: reversed?.district ?? null,
    postalCode: reversed?.postalCode ?? null,
    geoAddress,
    geoSource: 'gps' as const,
  }
}

export function buildVisitorGeoUpdate(metadata: Awaited<ReturnType<typeof buildVisitorSessionMetadata>>) {
  if (!metadata.country && !metadata.city && !metadata.timezone) return {}
  return {
    ...(metadata.country ? { country: metadata.country } : {}),
    ...(metadata.city ? { city: metadata.city } : {}),
    ...(metadata.timezone ? { timezone: metadata.timezone } : {}),
    browser: metadata.browser,
    os: metadata.os,
    device: metadata.device,
  }
}

export function formatVisitorGeoLine(input: {
  geoAddress?: string | null
  district?: string | null
  city?: string | null
  region?: string | null
  country?: string | null
  postalCode?: string | null
}): string {
  if (input.geoAddress?.trim()) return input.geoAddress.trim()
  return [input.district, input.city, input.region, input.postalCode, input.country]
    .filter(Boolean)
    .join(', ')
}
