import type { LiveVisitor } from '@/lib/stores/live-visitors-store'
import { parseUserAgent } from '@/lib/user-agent'
import { formatVisitorGeoLine } from '@/lib/visitor-session-enrich'

export type DeviceKind = 'mobile' | 'tablet' | 'desktop'

const DEVICE_LABELS: Record<DeviceKind, string> = {
  mobile: 'Telefon',
  tablet: 'Tablet',
  desktop: 'Bilgisayar',
}

export function resolveDeviceKind(input: {
  device?: string | null
  deviceType?: string | null
  userAgent?: string | null
}): DeviceKind {
  const dt = input.deviceType?.toLowerCase()
  if (dt === 'mobile' || dt === 'tablet' || dt === 'desktop') return dt

  const d = (input.device || '').toLowerCase()
  if (d.includes('mobile') || d.includes('iphone')) return 'mobile'
  if (d.includes('tablet') || d.includes('ipad')) return 'tablet'

  if (input.userAgent?.trim()) {
    return parseUserAgent(input.userAgent).deviceType
  }

  return 'desktop'
}

export function deviceKindLabel(kind: DeviceKind): string {
  return DEVICE_LABELS[kind]
}

export function formatVisitorTechLine(
  visitor: Pick<LiveVisitor, 'browser' | 'os' | 'device' | 'deviceType'>
): string {
  const kind = resolveDeviceKind(visitor)
  const parts = [deviceKindLabel(kind)]
  if (visitor.browser?.trim()) parts.push(visitor.browser.trim())
  if (visitor.os?.trim() && visitor.os.trim() !== 'Unknown') parts.push(visitor.os.trim())
  return parts.join(' · ')
}

export function formatGeoSourceLabel(geoSource?: string | null): string | null {
  if (geoSource === 'gps') return 'GPS — kesin konum'
  if (geoSource === 'ip') return 'IP — şehir düzeyi konum'
  return null
}

export function hasPreciseGeoCoords(
  latitude?: number | null,
  longitude?: number | null
): boolean {
  return typeof latitude === 'number' && typeof longitude === 'number'
}

export function formatVisitorLocationLine(
  visitor: Pick<
    LiveVisitor,
    | 'geoAddress'
    | 'city'
    | 'region'
    | 'country'
    | 'district'
    | 'postalCode'
    | 'latitude'
    | 'longitude'
    | 'geoSource'
  >
): string | null {
  const line = formatVisitorGeoLine(visitor)
  if (line) return line
  if (hasPreciseGeoCoords(visitor.latitude, visitor.longitude)) {
    return `${visitor.latitude!.toFixed(4)}, ${visitor.longitude!.toFixed(4)}`
  }
  return null
}

export function visitorHasMapLocation(
  visitor: Pick<
    LiveVisitor,
    'latitude' | 'longitude' | 'country' | 'city' | 'geoAddress'
  >
): boolean {
  if (hasPreciseGeoCoords(visitor.latitude, visitor.longitude)) return true
  return Boolean(visitor.country?.trim() || visitor.city?.trim() || visitor.geoAddress?.trim())
}
