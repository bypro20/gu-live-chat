const STORAGE_KEY = 'guchat-inbox-auto-translate'

export function readInboxAutoTranslatePref(): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === '1') return true
    if (saved === '0') return false
  } catch {
    /* ignore */
  }
  return null
}

export function writeInboxAutoTranslatePref(enabled: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
  } catch {
    /* ignore */
  }
}
