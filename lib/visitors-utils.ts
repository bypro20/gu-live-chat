import type { LiveVisitor, VisitorActivity } from '@/lib/stores/live-visitors-store'
import type { SiteLocale } from '@/lib/regional-config'
import { getVisitorsMessages } from '@/lib/visitors-i18n'

// ─── Time Formatting ────────────────────────────────────────────────

export function formatTimeAgo(date: string | Date, locale: SiteLocale = 'tr'): string {
  const t = getVisitorsMessages(locale).time
  const now = new Date()
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)

  if (diffSec < 10) return t.now
  if (diffSec < 60) return t.seconds(diffSec)
  if (diffMin < 60) return t.minutes(diffMin)
  if (diffHr < 24) return t.hours(diffHr)
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'tr-TR')
}

export function formatDuration(start: string | Date, end?: string | Date, locale: SiteLocale = 'tr'): string {
  const t = getVisitorsMessages(locale).time
  const s = typeof start === 'string' ? new Date(start) : start
  const e = end ? (typeof end === 'string' ? new Date(end) : end) : new Date()
  const diffMs = e.getTime() - s.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const remMin = diffMin % 60

  if (diffHr > 0) return t.durationHour(diffHr, remMin)
  if (diffMin > 0) return t.durationMin(diffMin)
  return t.justNow
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

export function getBrowserLabel(browser?: string | null, locale: SiteLocale = 'tr'): string {
  const b = (browser || '').toLowerCase()
  if (b.includes('chrome')) return 'Chrome'
  if (b.includes('firefox')) return 'Firefox'
  if (b.includes('safari')) return 'Safari'
  if (b.includes('edge')) return 'Edge'
  if (b.includes('opera')) return 'Opera'
  return browser || getVisitorsMessages(locale).device.unknown
}

export function getDeviceLabel(device?: string | null, locale: SiteLocale = 'tr'): string {
  const d = (device || '').toLowerCase()
  const labels = getVisitorsMessages(locale).device
  if (d.includes('mobile') || d.includes('iphone') || d.includes('android')) return labels.mobile
  if (d.includes('tablet') || d.includes('ipad')) return labels.tablet
  return labels.desktop
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
      avatar: 'from-violet-500 to-indigo-600 shadow-violet-500/25',
      border: 'border-l-violet-500',
      borderFull: 'border-violet-500/20',
      text: 'text-violet-400',
      textDark: 'text-violet-500',
      badge: 'bg-violet-500/10',
      gradient: 'from-violet-50 to-indigo-50 dark:from-violet-500/5 dark:to-indigo-500/5',
      gradientText: 'text-violet-600 dark:text-violet-400',
      button: 'bg-violet-600 hover:bg-violet-700',
      ring: 'ring-violet-500/20',
    }
  }
  return {
    avatar: 'from-[#1972F5] to-[#2563EB] shadow-[#1972F5]/25',
    border: 'border-l-[#1972F5]',
    borderFull: 'border-[#1972F5]/20',
    text: 'text-[#1972F5] dark:text-[#60A5FA]',
    textDark: 'text-[#1972F5]',
    badge: 'bg-[#1972F5]/5 dark:bg-[#1972F5]/10',
    gradient: 'from-blue-50 to-sky-50 dark:from-[#1972F5]/5 dark:to-[#2563EB]/5',
    gradientText: 'text-[#1972F5] dark:text-[#60A5FA]',
    button: 'bg-[#1972F5] hover:bg-[#1565DB]',
    ring: 'ring-[#1972F5]/20',
  }
}