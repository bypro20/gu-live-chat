/** Widget mesaj çevirileri — oturum boyunca kalıcı (polling/socket sonrası kaybolmaz) */

export function widgetTranslateStorageKey(websiteId: string): string {
  return `gu_widget_tr_${websiteId}`
}

export function widgetTranslateCacheKey(messageId: string, lang: string): string {
  return `${messageId}:${lang}`
}

export function loadWidgetTranslationCache(websiteId: string): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(widgetTranslateStorageKey(websiteId))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveWidgetTranslationCache(
  websiteId: string,
  cache: Record<string, string>
): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(widgetTranslateStorageKey(websiteId), JSON.stringify(cache))
  } catch {
    /* quota — sessiz */
  }
}

/** Belirli dil için mesaj id → çeviri metni */
export function translationsForLang(
  cache: Record<string, string>,
  lang: string
): Record<string, string> {
  const suffix = `:${lang}`
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(cache)) {
    if (key.endsWith(suffix)) {
      const msgId = key.slice(0, -suffix.length)
      if (msgId && value) out[msgId] = value
    }
  }
  return out
}

export function readAutoTranslatePref(websiteId: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    const v = localStorage.getItem(`gu_widget_auto_tr_${websiteId}`)
    if (v === '0') return false
    if (v === '1') return true
  } catch {
    /* ignore */
  }
  return true
}

export function writeAutoTranslatePref(websiteId: string, on: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`gu_widget_auto_tr_${websiteId}`, on ? '1' : '0')
  } catch {
    /* ignore */
  }
}
