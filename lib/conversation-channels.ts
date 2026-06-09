export type ConversationChannel =
  | 'WIDGET'
  | 'WHATSAPP'
  | 'TELEGRAM'
  | 'INSTAGRAM'
  | 'MESSENGER'
  | 'EMAIL'
  | 'SMS'
  | 'SLACK'
  | 'API'
  | 'IMPORT'

export const CHANNEL_META: Record<
  ConversationChannel,
  { label: string; color: string; short: string }
> = {
  WIDGET: { label: 'Web Widget', color: '#1972F5', short: 'Web' },
  WHATSAPP: { label: 'WhatsApp', color: '#25D366', short: 'WA' },
  TELEGRAM: { label: 'Telegram', color: '#0088CC', short: 'TG' },
  INSTAGRAM: { label: 'Instagram', color: '#E4405F', short: 'IG' },
  MESSENGER: { label: 'Messenger', color: '#0084FF', short: 'FB' },
  EMAIL: { label: 'E-posta', color: '#6366F1', short: 'Mail' },
  SMS: { label: 'SMS', color: '#F97316', short: 'SMS' },
  SLACK: { label: 'Slack', color: '#4A154B', short: 'Slack' },
  API: { label: 'API', color: '#64748B', short: 'API' },
  IMPORT: { label: 'İçe aktarım', color: '#94A3B8', short: 'Import' },
}

export const INBOX_CHANNEL_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'Tüm kanallar' },
  { key: 'WIDGET', label: 'Web' },
  { key: 'WHATSAPP', label: 'WhatsApp' },
  { key: 'INSTAGRAM', label: 'Instagram' },
  { key: 'MESSENGER', label: 'Messenger' },
  { key: 'TELEGRAM', label: 'Telegram' },
  { key: 'EMAIL', label: 'E-posta' },
]

export function normalizeChannel(source?: string | null): ConversationChannel {
  const key = (source || 'WIDGET').toUpperCase()
  if (key in CHANNEL_META) return key as ConversationChannel
  return 'WIDGET'
}

export function channelLabel(source?: string | null): string {
  return CHANNEL_META[normalizeChannel(source)].label
}

export function channelColor(source?: string | null): string {
  return CHANNEL_META[normalizeChannel(source)].color
}
