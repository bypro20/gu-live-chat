'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

const INIT_KEY = 'gu-panel-dark-init-v2'

/**
 * Panel açılışı:
 * 1) İlk ziyarette koyu temayı varsayılan yapar (kullanıcı sonra değiştirebilir).
 *    Yalnızca panel sayfalarında çalışır; üçüncü taraf sitelerdeki widget etkilenmez.
 * 2) `.surface` kartlarının üstünde imleç ışığı için --mx/--my değişkenlerini günceller.
 */
export function PanelBoot() {
  const { setTheme } = useTheme()

  useEffect(() => {
    try {
      if (!localStorage.getItem(INIT_KEY)) {
        localStorage.setItem(INIT_KEY, '1')
        // Eski otomatik 'light' kaydı olan kullanıcıları da yeni koyu varsayılana geçir (bir kez).
        setTheme('dark')
      }
    } catch {
      // gizli mod
    }
  }, [setTheme])

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.('.surface')
      if (!(el instanceof HTMLElement)) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    return () => document.removeEventListener('pointermove', onMove)
  }, [])

  return null
}
