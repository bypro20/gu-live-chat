import type { InboxAttachment } from './types'

export function timeAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'şimdi'
  if (diff < 3600) return `${Math.floor(diff / 60)} dk`
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa`
  return `${Math.floor(diff / 86400)} g`
}

export function formatMessageTime(date: string): string {
  return new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateDivider(date: string): string {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Bugün'
  if (d.toDateString() === yesterday.toDateString()) return 'Dün'
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function attName(a: InboxAttachment): string {
  return a.fileName || a.filename || 'dosya'
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

export function visitorDisplayName(
  name: string | null | undefined,
  email: string | null | undefined
): string {
  return name || email?.split('@')[0] || 'Anonim'
}

export const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Açık',
  PENDING: 'Bekliyor',
  RESOLVED: 'Çözüldü',
  CLOSED: 'Kapalı',
}
