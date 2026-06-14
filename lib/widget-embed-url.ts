import { marketingDomainVariants, SITE_DOMAIN } from '@/lib/site-config'

const PLATFORM_HOSTS = new Set(
  [
    SITE_DOMAIN,
    `www.${SITE_DOMAIN}`,
    'localhost',
    '127.0.0.1',
    ...marketingDomainVariants().map((v) => v.replace(/^https?:\/\//, '').replace(/\/$/, '')),
  ].map((h) => h.toLowerCase()),
)

/** Domain parking / satış sayfaları — embed kurulumu sayılmaz. */
const PARKING_HOST_RE =
  /(?:^|\.)((?:hugedomains|sedo|afternic|godaddy|namecheap|dynadot|domainmarket|undeveloped|brandpa|atom|dan|domain)\.com|parkingcrew\.net|above\.com|buydomains\.com)(?:\/|$)/i

const PARKING_PATH_RE =
  /(?:domain_profile|domain-search|buy-domain|domain-for-sale|parked|is-for-sale|forsale)/i

export function extractUrlHost(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  try {
    const parsed = new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`)
    return parsed.hostname.toLowerCase()
  } catch {
    return null
  }
}

export function normalizeExternalUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const trimmed = url.trim()
  try {
    return new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`).toString()
  } catch {
    return null
  }
}

export function isWidgetPlatformHost(host: string | null | undefined): boolean {
  if (!host) return false
  const h = host.toLowerCase()
  if (PLATFORM_HOSTS.has(h)) return true
  return [...PLATFORM_HOSTS].some((platform) => h === platform || h.endsWith(`.${platform}`))
}

export function isWidgetPlatformUrl(url: string | null | undefined): boolean {
  const host = extractUrlHost(url)
  if (!host) return false
  if (isWidgetPlatformHost(host)) return true
  // /widget/ path on any host is our iframe shell, not customer site
  try {
    const parsed = new URL(normalizeExternalUrl(url) || url!)
    if (parsed.pathname.includes('/widget/')) return true
  } catch {
    /* ignore */
  }
  return false
}

export function isDomainParkingUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false
  const normalized = normalizeExternalUrl(url)
  if (!normalized) return false
  try {
    const parsed = new URL(normalized)
    const host = parsed.hostname.toLowerCase()
    if (PARKING_HOST_RE.test(host) || PARKING_HOST_RE.test(parsed.href)) return true
    if (PARKING_PATH_RE.test(parsed.pathname) || PARKING_PATH_RE.test(parsed.href)) return true
  } catch {
    return false
  }
  return false
}

/** Müşterinin sitesinde widget'ın gerçekten yüklendiği sayfa URL'si mi? */
export function isValidCustomerEmbedUrl(url: string | null | undefined): boolean {
  const normalized = normalizeExternalUrl(url)
  if (!normalized) return false
  if (isWidgetPlatformUrl(normalized)) return false
  if (isDomainParkingUrl(normalized)) return false
  const host = extractUrlHost(normalized)
  if (!host) return false
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return false
  return true
}

export function buildRegisteredSiteUrl(domain: string | null | undefined): string | null {
  if (!domain?.trim()) return null
  return normalizeExternalUrl(domain.trim())
}
