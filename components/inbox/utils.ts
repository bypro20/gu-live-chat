import type { InboxAttachment } from './types'
import type { DashboardMessages } from '@/lib/dashboard-i18n'
import {
  formatInboxTimeAgo,
  formatInboxMessageTime,
  formatInboxDateDivider,
  visitorDisplayName as i18nVisitorName,
  inboxStatusLabels,
} from '@/lib/dashboard-i18n'
import type { SiteLocale } from '@/lib/regional-config'
import { getDashboardMessages } from '@/lib/dashboard-i18n'

export function timeAgo(date: string, d: DashboardMessages): string {
  return formatInboxTimeAgo(date, d)
}

export function formatMessageTime(date: string, locale: SiteLocale): string {
  return formatInboxMessageTime(date, locale)
}

export function formatDateDivider(date: string, d: DashboardMessages, locale: SiteLocale): string {
  return formatInboxDateDivider(date, d, locale)
}

export function visitorDisplayName(
  name: string | null | undefined,
  email: string | null | undefined,
  d?: DashboardMessages
): string {
  return i18nVisitorName(name, email, d ?? getDashboardMessages('tr'))
}

export function getStatusLabels(d: DashboardMessages): Record<string, string> {
  return inboxStatusLabels(d)
}

/** @deprecated use getStatusLabels(d) */
export const STATUS_LABELS: Record<string, string> = inboxStatusLabels(getDashboardMessages('tr'))

export function attName(a: InboxAttachment, fileLabel = 'file'): string {
  return a.fileName || a.filename || fileLabel
}

export function attMime(a: InboxAttachment): string {
  return (a.mimeType || a.mimetype || '') as string
}

export function attSize(a: InboxAttachment): number | undefined {
  return (a.fileSize ?? a.size) ?? undefined
}

export function isImageAtt(a: InboxAttachment): boolean {
  const mime = attMime(a)
  if (mime) return mime.startsWith('image/')
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(attName(a) || a.url)
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}
