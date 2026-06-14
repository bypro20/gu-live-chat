/** Widget ziyaretçi kimliği — isim/e-posta zorunluluğu */

import { withWidgetIdentityDefaults } from '@/lib/widget-platform-defaults'

export type WidgetIdentityConfig = {
  showPreChatForm?: boolean | null
  requireName?: boolean | null
  requireEmail?: boolean | null
}

export type VisitorIdentity = {
  name?: string | null
  email?: string | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function resolved(config: WidgetIdentityConfig | null | undefined) {
  return withWidgetIdentityDefaults(config)
}

export function widgetIdentityRequired(config: WidgetIdentityConfig | null | undefined): boolean {
  const s = resolved(config)
  if (s.showPreChatForm === false) return false
  return s.requireName === true || s.requireEmail === true
}

export function visitorHasRequiredIdentity(
  config: WidgetIdentityConfig | null | undefined,
  visitor: VisitorIdentity | null | undefined,
): boolean {
  if (!widgetIdentityRequired(config)) return true
  const s = resolved(config)
  const name = (visitor?.name ?? '').trim()
  const email = (visitor?.email ?? '').trim()
  if (s.requireName === true && name.length < 2) return false
  if (s.requireEmail === true && !EMAIL_RE.test(email)) return false
  return true
}

export function validateVisitorIdentityInput(
  config: WidgetIdentityConfig | null | undefined,
  name: string | undefined,
  email: string | undefined,
): string | null {
  if (!widgetIdentityRequired(config)) return null
  const s = resolved(config)
  const n = (name ?? '').trim()
  const e = (email ?? '').trim()
  if (s.requireName === true && n.length < 2) {
    return 'Lütfen adınızı ve soyadınızı girin.'
  }
  if (s.requireEmail === true && !EMAIL_RE.test(e)) {
    return 'Lütfen geçerli bir e-posta adresi girin.'
  }
  return null
}

export function resolveVisitorIdentity(
  config: WidgetIdentityConfig | null | undefined,
  bodyName: string | undefined,
  bodyEmail: string | undefined,
  visitor: VisitorIdentity | null | undefined,
): { name: string | null; email: string | null; error: string | null } {
  const name = (bodyName ?? visitor?.name ?? '').trim() || null
  const email = (bodyEmail ?? visitor?.email ?? '').trim() || null
  const error = validateVisitorIdentityInput(config, name ?? undefined, email ?? undefined)
  return { name, email, error }
}
