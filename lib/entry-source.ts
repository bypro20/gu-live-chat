/** Ziyaretçinin siteye nasıl geldiğini okunabilir metne çevirir. */

export type EntrySourceInput = {
  referrer?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  landingPage?: string | null
}

const REFERRER_LABELS: Array<{ test: RegExp; label: string }> = [
  { test: /google\./i, label: 'Google araması' },
  { test: /bing\./i, label: 'Bing araması' },
  { test: /yandex\./i, label: 'Yandex araması' },
  { test: /facebook\.|fb\./i, label: 'Facebook' },
  { test: /instagram\./i, label: 'Instagram' },
  { test: /twitter\.|t\.co|x\.com/i, label: 'X (Twitter)' },
  { test: /linkedin\./i, label: 'LinkedIn' },
  { test: /youtube\./i, label: 'YouTube' },
  { test: /tiktok\./i, label: 'TikTok' },
  { test: /whatsapp\./i, label: 'WhatsApp' },
  { test: /telegram\./i, label: 'Telegram' },
]

function hostFromUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  try {
    return new URL(raw).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function utmLabel(source: string, medium?: string | null): string {
  const s = source.toLowerCase()
  const m = (medium || '').toLowerCase()
  if (m.includes('cpc') || m.includes('ppc') || m.includes('paid')) return `${source} — ücretli reklam`
  if (m.includes('email')) return `${source} — e-posta`
  if (m.includes('social')) return `${source} — sosyal medya`
  if (m.includes('organic')) return `${source} — organik`
  if (s.includes('google')) return 'Google reklamı / kampanya'
  return `${source}${medium ? ` (${medium})` : ''}`
}

export function resolveEntrySource(input: EntrySourceInput): string | null {
  if (input.utmSource?.trim()) {
    return utmLabel(input.utmSource.trim(), input.utmMedium)
  }

  const refHost = hostFromUrl(input.referrer)
  if (refHost) {
    for (const rule of REFERRER_LABELS) {
      if (rule.test.test(refHost)) return rule.label
    }
    return `${refHost} üzerinden`
  }

  const landingHost = hostFromUrl(input.landingPage)
  if (landingHost) {
    return 'Doğrudan giriş'
  }

  return 'Doğrudan giriş'
}

export function parseUtmFromUrl(url: string | null | undefined): {
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
} {
  if (!url?.trim()) {
    return { utmSource: null, utmMedium: null, utmCampaign: null }
  }
  try {
    const parsed = new URL(url)
    return {
      utmSource: parsed.searchParams.get('utm_source'),
      utmMedium: parsed.searchParams.get('utm_medium'),
      utmCampaign: parsed.searchParams.get('utm_campaign'),
    }
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null }
  }
}
