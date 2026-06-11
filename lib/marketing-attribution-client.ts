'use client'

import {
  ATTRIBUTION_STORAGE_KEY,
  parseAttributionFromSearchParams,
  type StoredAttribution,
} from './marketing-attribution'

export function readStoredAttribution(): StoredAttribution | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ATTRIBUTION_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredAttribution
  } catch {
    return null
  }
}

/** İlk ziyarette UTM/ref yakala — first-touch, üzerine yazma */
export function captureAttributionFromCurrentUrl(): StoredAttribution | null {
  if (typeof window === 'undefined') return null

  const existing = readStoredAttribution()
  const params = new URLSearchParams(window.location.search)
  const parsed = parseAttributionFromSearchParams(params, window.location.pathname)

  if (existing) return existing
  if (!parsed) return null

  const stored: StoredAttribution = {
    ...parsed,
    signupReferrer: document.referrer || undefined,
    capturedAt: new Date().toISOString(),
  }

  try {
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // private mode
  }

  return stored
}
