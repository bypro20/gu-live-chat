/** Ülke/şehir adından harita pini için yaklaşık koordinatlar (IP yoksa yedek). */

export type CountryCoord = { lat: number; lng: number; label: string }

const COUNTRY_COORDS: Record<string, CountryCoord> = {
  TR: { lat: 39.0, lng: 35.0, label: 'Türkiye' },
  TURKEY: { lat: 39.0, lng: 35.0, label: 'Türkiye' },
  TÜRKIYE: { lat: 39.0, lng: 35.0, label: 'Türkiye' },
  US: { lat: 39.8, lng: -98.5, label: 'ABD' },
  'UNITED STATES': { lat: 39.8, lng: -98.5, label: 'ABD' },
  GB: { lat: 54.0, lng: -2.0, label: 'İngiltere' },
  DE: { lat: 51.1, lng: 10.4, label: 'Almanya' },
  FR: { lat: 46.2, lng: 2.2, label: 'Fransa' },
  NL: { lat: 52.1, lng: 5.3, label: 'Hollanda' },
  RU: { lat: 61.5, lng: 105.3, label: 'Rusya' },
  CN: { lat: 35.8, lng: 104.1, label: 'Çin' },
  JP: { lat: 36.2, lng: 138.2, label: 'Japonya' },
  BR: { lat: -14.2, lng: -51.9, label: 'Brezilya' },
  IN: { lat: 20.5, lng: 78.9, label: 'Hindistan' },
  CA: { lat: 56.1, lng: -106.3, label: 'Kanada' },
  AU: { lat: -25.2, lng: 133.7, label: 'Avustralya' },
  IT: { lat: 41.8, lng: 12.5, label: 'İtalya' },
  ES: { lat: 40.4, lng: -3.7, label: 'İspanya' },
  SA: { lat: 24.0, lng: 45.0, label: 'Suudi Arabistan' },
  AE: { lat: 23.4, lng: 53.8, label: 'BAE' },
  AZ: { lat: 40.1, lng: 47.5, label: 'Azerbaycan' },
  GR: { lat: 39.0, lng: 22.0, label: 'Yunanistan' },
}

const CITY_COORDS: Record<string, CountryCoord> = {
  istanbul: { lat: 41.0082, lng: 28.9784, label: 'İstanbul' },
  ankara: { lat: 39.9334, lng: 32.8597, label: 'Ankara' },
  izmir: { lat: 38.4237, lng: 27.1428, label: 'İzmir' },
  bursa: { lat: 40.1885, lng: 29.061, label: 'Bursa' },
  antalya: { lat: 36.8969, lng: 30.7133, label: 'Antalya' },
  denizli: { lat: 37.7765, lng: 29.0864, label: 'Denizli' },
  london: { lat: 51.5074, lng: -0.1278, label: 'Londra' },
  berlin: { lat: 52.52, lng: 13.405, label: 'Berlin' },
  paris: { lat: 48.8566, lng: 2.3522, label: 'Paris' },
  'new york': { lat: 40.7128, lng: -74.006, label: 'New York' },
}

function normalizeKey(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR')
}

export function fallbackCoordsFromLocation(
  country?: string | null,
  city?: string | null
): (CountryCoord & { approximate: true }) | null {
  if (city) {
    const cityKey = normalizeKey(city)
    const cityHit = CITY_COORDS[cityKey]
    if (cityHit) return { ...cityHit, approximate: true }
  }

  if (!country) return null
  const countryKey = country.trim().toUpperCase()
  const hit = COUNTRY_COORDS[countryKey] || COUNTRY_COORDS[normalizeKey(country)]
  if (!hit) return null
  return { ...hit, approximate: true }
}

export const DEFAULT_MAP_CENTER: CountryCoord = { lat: 39.0, lng: 35.0, label: 'Türkiye' }

export function resolveVisitorMapCoords(input: {
  latitude?: number | null
  longitude?: number | null
  country?: string | null
  city?: string | null
}): { lat: number; lng: number; approximate: boolean } | null {
  if (typeof input.latitude === 'number' && typeof input.longitude === 'number') {
    return { lat: input.latitude, lng: input.longitude, approximate: false }
  }
  const fallback = fallbackCoordsFromLocation(input.country, input.city)
  if (fallback) {
    return { lat: fallback.lat, lng: fallback.lng, approximate: true }
  }
  return null
}
