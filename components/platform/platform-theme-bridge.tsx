'use client'

import { useEffect } from 'react'
import {
  applyPlatformThemeToDocument,
  PLATFORM_THEME_UPDATED_EVENT,
  type PlatformTheme,
} from '@/lib/platform-theme'

/** İstemci gezinmesinde tema CSS'ini güncel tutar */
export function PlatformThemeBridge() {
  useEffect(() => {
    const sync = async () => {
      try {
        const res = await fetch('/api/platform/theme', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as { theme: PlatformTheme }
        if (data.theme) applyPlatformThemeToDocument(data.theme)
      } catch {
        /* varsayılan CSS kalır */
      }
    }

    void sync()

    const onUpdated = (event: Event) => {
      const detail = (event as CustomEvent<PlatformTheme>).detail
      if (detail) applyPlatformThemeToDocument(detail)
      else void sync()
    }

    window.addEventListener(PLATFORM_THEME_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(PLATFORM_THEME_UPDATED_EVENT, onUpdated)
  }, [])

  return null
}
