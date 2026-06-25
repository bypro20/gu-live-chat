/** OpenStreetMap Nominatim ile koordinattan adres bileşenleri. */

export type ReverseGeoParts = {
  geoAddress: string
  district: string | null
  postalCode: string | null
}

type NominatimAddress = {
  house_number?: string
  road?: string
  neighbourhood?: string
  suburb?: string
  quarter?: string
  city_district?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  state?: string
  postcode?: string
  country?: string
}

const reverseCache = new Map<string, { data: ReverseGeoParts; expiresAt: number }>()
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`
}

function formatTurkishAddress(address: NominatimAddress): ReverseGeoParts {
  const mahalle =
    address.neighbourhood ||
    address.suburb ||
    address.quarter ||
    address.city_district ||
    null

  const street = address.road
    ? address.house_number
      ? `${address.road} No: ${address.house_number}`
      : address.road
    : null

  const locality = address.city || address.town || address.village || address.municipality || null

  const segments = [street, mahalle, locality, address.state, address.country].filter(Boolean)

  return {
    geoAddress: segments.join(', ') || [locality, address.state, address.country].filter(Boolean).join(', '),
    district: mahalle || address.city_district || null,
    postalCode: address.postcode || null,
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeoParts | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const key = cacheKey(lat, lng)
  const cached = reverseCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.data

  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'json')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lng))
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('accept-language', 'tr')

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'GuLiveChat/1.0 (visitor-tracking; support@gulivechat.com)',
      },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null

    const data = (await res.json()) as { address?: NominatimAddress; display_name?: string }
    const parts = data.address ? formatTurkishAddress(data.address) : null
    const result: ReverseGeoParts = parts || {
      geoAddress: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      district: null,
      postalCode: null,
    }

    reverseCache.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL_MS })
    return result
  } catch {
    return null
  }
}
