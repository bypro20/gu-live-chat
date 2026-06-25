import type { LiveVisitor } from '@/lib/stores/live-visitors-store'

export function withLiveVisitorGeo<T extends Record<string, unknown>>(
  row: T,
  session?: {
    district?: string | null
    postalCode?: string | null
    geoAddress?: string | null
    geoSource?: string | null
    entrySource?: string | null
    isp?: string | null
    referrer?: string | null
    landingPage?: string | null
    latitude?: number | null
    longitude?: number | null
    region?: string | null
    city?: string | null
    country?: string | null
    ipAddress?: string | null
  } | null
): T & Pick<
  LiveVisitor,
  | 'district'
  | 'postalCode'
  | 'geoAddress'
  | 'geoSource'
  | 'entrySource'
  | 'isp'
  | 'referrer'
  | 'landingPage'
  | 'latitude'
  | 'longitude'
  | 'region'
  | 'city'
  | 'country'
  | 'ipAddress'
> {
  return {
    ...row,
    district: (row.district as string | null | undefined) ?? session?.district ?? null,
    postalCode: (row.postalCode as string | null | undefined) ?? session?.postalCode ?? null,
    geoAddress: (row.geoAddress as string | null | undefined) ?? session?.geoAddress ?? null,
    geoSource: (row.geoSource as string | null | undefined) ?? session?.geoSource ?? null,
    entrySource: (row.entrySource as string | null | undefined) ?? session?.entrySource ?? null,
    isp: (row.isp as string | null | undefined) ?? session?.isp ?? null,
    referrer: (row.referrer as string | null | undefined) ?? session?.referrer ?? null,
    landingPage: (row.landingPage as string | null | undefined) ?? session?.landingPage ?? null,
    latitude: (row.latitude as number | null | undefined) ?? session?.latitude ?? null,
    longitude: (row.longitude as number | null | undefined) ?? session?.longitude ?? null,
    region: (row.region as string | null | undefined) ?? session?.region ?? null,
    city: (row.city as string | null | undefined) ?? session?.city ?? null,
    country: (row.country as string | null | undefined) ?? session?.country ?? null,
    ipAddress: (row.ipAddress as string | null | undefined) ?? session?.ipAddress ?? null,
  }
}

/** Google Maps — koordinat veya adres araması. */
export function mapsExternalUrl(lat: number, lng: number, _label?: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function resolveVisitorMapsUrl(input: {
  latitude?: number | null
  longitude?: number | null
  country?: string | null
  city?: string | null
  region?: string | null
  geoAddress?: string | null
  name?: string | null
}): string | null {
  if (typeof input.latitude === 'number' && typeof input.longitude === 'number') {
    return mapsExternalUrl(input.latitude, input.longitude)
  }
  const line =
    input.geoAddress?.trim() ||
    [input.city, input.region, input.country].filter(Boolean).join(', ')
  if (line) return mapsSearchUrl(line)
  return null
}

export function visitorDisplayName(name?: string | null): string {
  const n = name?.trim()
  if (!n || n.toLowerCase() === 'anonim' || n.toLowerCase() === 'anonymous') return 'Anonim'
  return n
}
