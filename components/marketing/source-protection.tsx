'use client'

import { useEffect } from 'react'

/**
 * Marketing sitede kaynak görüntülemeyi zorlaştırır.
 * Not: view-source: ve DevTools tamamen engellenemez — tarayıcı güvenlik modeli buna izin vermez.
 * Asıl kod (API, veritabanı, sunucu) zaten istemciye gönderilmez.
 */
export function SourceProtection() {
  useEffect(() => {
    const blockShortcut = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey
      const blocked =
        key === 'f12' ||
        (ctrl && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (ctrl && ['u', 's', 'p'].includes(key))
      if (blocked) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    document.addEventListener('keydown', blockShortcut, true)
    document.addEventListener('contextmenu', blockContextMenu)

    return () => {
      document.removeEventListener('keydown', blockShortcut, true)
      document.removeEventListener('contextmenu', blockContextMenu)
    }
  }, [])

  return null
}
