import type { LiveVisitor, VisitorActivity } from '@/lib/stores/live-visitors-store'

// ─── Time Formatting ────────────────────────────────────────────────

export function formatTimeAgo(date: string | Date): string {
  const now = new Date()
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)

  if (diffSec < 10) return 'Şimdi'
  if (diffSec < 60) return `${diffSec}s`
  if (diffMin < 60) return `${diffMin}dk`
  if (diffHr < 24) return `${diffHr}sa`
  return d.toLocaleDateString('tr-TR')
}

export function formatDuration(start: string | Date, end?: string | Date): string {
  const s = typeof start === 'string' ? new Date(start) : start
  const e = end ? (typeof end === 'string' ? new Date(end) : end) : new Date()
  const diffMs = e.getTime() - s.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const remMin = diffMin % 60

  if (diffHr > 0) return `${diffHr}sa ${remMin}dk`
  if (diffMin > 0) return `${diffMin}dk`
  return 'Az önce'
}

// ─── Page History Extraction ─────────────────────────────────────────

export interface PageHistoryItem {
  title: string
  url: string
  timestamp: string
}

export function extractPageHistory(activities: VisitorActivity[]): PageHistoryItem[] {
  const seen = new Set<string>()
  const pages: PageHistoryItem[] = []
  for (const a of activities) {
    if (a.eventType === 'pageview' && a.url) {
      const key = a.url
      if (!seen.has(key)) {
        seen.add(key)
        pages.push({ title: a.title || a.url, url: a.url, timestamp: a.timestamp })
      }
    }
  }
  return pages
}

// ─── Favicon ────────────────────────────────────────────────────────

export function getFaviconUrl(pageUrl: string | undefined): string {
  if (!pageUrl) return ''
  try {
    const domain = new URL(pageUrl).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

export function parsePageUrl(pageUrl: string | undefined): { domain: string; path: string; full: string } {
  if (!pageUrl) return { domain: '', path: '', full: '' }
  try {
    const u = new URL(pageUrl)
    return { domain: u.hostname, path: u.pathname + u.search, full: pageUrl }
  } catch {
    return { domain: pageUrl, path: '', full: pageUrl }
  }
}

// ─── Scroll Percentage ──────────────────────────────────────────────

export function getScrollPercent(visitor: LiveVisitor): number | null {
  if (!visitor.viewportH || !visitor.documentH || visitor.documentH <= visitor.viewportH) return null
  return Math.round(((visitor.scrollY || 0) / (visitor.documentH - visitor.viewportH)) * 100)
}

// ─── Browser / Device Icons ─────────────────────────────────────────

export function getBrowserLabel(browser?: string | null): string {
  const b = (browser || '').toLowerCase()
  if (b.includes('chrome')) return 'Chrome'
  if (b.includes('firefox')) return 'Firefox'
  if (b.includes('safari')) return 'Safari'
  if (b.includes('edge')) return 'Edge'
  if (b.includes('opera')) return 'Opera'
  return browser || 'Bilinmiyor'
}

export function getDeviceLabel(device?: string | null): string {
  const d = (device || '').toLowerCase()
  if (d.includes('mobile') || d.includes('iphone') || d.includes('android')) return 'Mobil'
  if (d.includes('tablet') || d.includes('ipad')) return 'Tablet'
  return 'Masaüstü'
}

export function getBrowserEmoji(browser?: string | null): string {
  const b = (browser || '').toLowerCase()
  if (b.includes('chrome')) return '🌐'
  if (b.includes('firefox')) return '🦊'
  if (b.includes('safari')) return '🧭'
  if (b.includes('edge')) return '🔵'
  if (b.includes('opera')) return '🔴'
  return '💻'
}

export function getDeviceEmoji(device?: string | null): string {
  const d = (device || '').toLowerCase()
  if (d.includes('mobile') || d.includes('iphone') || d.includes('android')) return '📱'
  if (d.includes('tablet') || d.includes('ipad')) return '📋'
  return '🖥️'
}

// ─── Theme Accent Classes ────────────────────────────────────────────

export type VisitorTheme = 'dashboard' | 'admin'

export function getAccent(theme: VisitorTheme) {
  if (theme === 'admin') {
    return {
      avatar: 'from-red-500 to-rose-600 shadow-red-500/25',
      border: 'border-l-red-500',
      borderFull: 'border-red-500/20',
      text: 'text-red-400',
      textDark: 'text-red-500',
      badge: 'bg-red-500/10',
      gradient: 'from-red-50 to-rose-50 dark:from-red-500/5 dark:to-rose-500/5',
      gradientText: 'text-red-600 dark:text-red-400',
      button: 'bg-red-500 hover:bg-red-600',
      ring: 'ring-red-500/20',
    }
  }
  return {
    avatar: 'from-[#6C3CE1] to-[#EC4899] shadow-[#6C3CE1]/25',
    border: 'border-l-[#6C3CE1]',
    borderFull: 'border-[#6C3CE1]/20',
    text: 'text-[#6C3CE1] dark:text-[#A78BFA]',
    textDark: 'text-[#6C3CE1]',
    badge: 'bg-[#6C3CE1]/5 dark:bg-[#6C3CE1]/10',
    gradient: 'from-purple-50 to-pink-50 dark:from-[#6C3CE1]/5 dark:to-[#EC4899]/5',
    gradientText: 'text-[#6C3CE1] dark:text-[#A78BFA]',
    button: 'bg-[#6C3CE1] hover:bg-[#7C4CE1]',
    ring: 'ring-[#6C3CE1]/20',
  }
}