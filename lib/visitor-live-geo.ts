import type { LiveVisitor } from '@/lib/stores/live-visitors-store'

/** API / socket yanıtlarını LiveVisitor geo alanlarıyla eşler. */
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

export function mapsExternalUrl(lat: number, lng: number, label?: string): string {
  const q = label ? encodeURIComponent(label) : `${lat},${lng}`
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
}
