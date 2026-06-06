export interface GeoLocation {
  country: string | null
  countryCode: string | null
  city: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
  timezone: string | null
  isp: string | null
}

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
]

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some((p) => p.test(ip))
}

const geoCache = new Map<string, { data: GeoLocation; expiresAt: number }>()
const CACHE_TTL_MS = 60 * 60 * 1000

export async function lookupIpGeo(ip: string | null | undefined): Promise<GeoLocation | null> {
  if (!ip || isPrivateIp(ip)) return null

  const cached = geoCache.get(ip)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,regionName,city,lat,lon,timezone,isp`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null

    const data = await res.json()
    if (data.status !== 'success') return null

    const result: GeoLocation = {
      country: data.country || null,
      countryCode: data.countryCode || null,
      city: data.city || null,
      region: data.regionName || null,
      latitude: typeof data.lat === 'number' ? data.lat : null,
      longitude: typeof data.lon === 'number' ? data.lon : null,
      timezone: data.timezone || null,
      isp: data.isp || null,
    }

    geoCache.set(ip, { data: result, expiresAt: Date.now() + CACHE_TTL_MS })
    return result
  } catch {
    return null
  }
}
