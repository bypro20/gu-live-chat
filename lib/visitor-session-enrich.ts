import { lookupIpGeo } from '@/lib/geo'
import { resolveEntrySource, type EntrySourceInput } from '@/lib/entry-source'
import { reverseGeocode } from '@/lib/reverse-geocode'
import { parseUserAgent } from '@/lib/user-agent'

export async function buildVisitorSessionMetadata(input: {
  userAgent?: string | null
  clientIp?: string | null
  entry?: EntrySourceInput
}) {
  const ua = parseUserAgent(input.userAgent || '')
  const geo = await lookupIpGeo(input.clientIp)
  const entrySource = input.entry ? resolveEntrySource(input.entry) : null

  return {
    ipAddress: input.clientIp || null,
    userAgent: input.userAgent ?? null,
    browser: ua.browser,
    os: ua.os,
    device: ua.device,
    deviceType: ua.deviceType,
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
    geoSource: geo?.latitude != null ? 'ip' : null,
    entrySource,
  }
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
