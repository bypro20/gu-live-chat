import { lookupIpGeo } from '@/lib/geo'
import { parseUserAgent } from '@/lib/user-agent'

export async function buildVisitorSessionMetadata(input: {
  userAgent?: string | null
  clientIp?: string | null
}) {
  const ua = parseUserAgent(input.userAgent || '')
  const geo = await lookupIpGeo(input.clientIp)

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
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
    timezone: geo?.timezone ?? null,
    isp: geo?.isp ?? null,
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
