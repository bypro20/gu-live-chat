'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { isDarkHexColor, PLATFORM_THEME_UPDATED_EVENT } from '@/lib/platform-theme'

const STORAGE_KEY = 'gu-admin-theme'

export type AdminTheme = 'dark' | 'light'

interface AdminThemeContextValue {
  theme: AdminTheme
  setTheme: (theme: AdminTheme) => void
  toggleTheme: () => void
  mounted: boolean
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null)

function syncAdminThemeDom(mode: AdminTheme) {
  document.querySelectorAll('.admin-shell-v2, .admin-overlay-host').forEach((el) => {
    el.setAttribute('data-admin-theme', mode)
  })
}

function inferAdminThemeFromDom(): AdminTheme {
  const shell = document.querySelector('.admin-shell-v2')
  if (!shell) return 'light'
  const bg = getComputedStyle(shell).getPropertyValue('--admin-bg').trim()
  if (!bg) return 'light'
  return isDarkHexColor(bg) ? 'dark' : 'light'
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>('light')
  const [mounted, setMounted] = useState(false)

  const syncFromPlatform = useCallback(() => {
    const mode = inferAdminThemeFromDom()
    setThemeState(mode)
    syncAdminThemeDom(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }, [])

  useEffect(() => {
    syncFromPlatform()
    setMounted(true)

    const onThemeUpdated = () => {
      requestAnimationFrame(syncFromPlatform)
    }

    window.addEventListener(PLATFORM_THEME_UPDATED_EVENT, onThemeUpdated)
    return () => window.removeEventListener(PLATFORM_THEME_UPDATED_EVENT, onThemeUpdated)
  }, [syncFromPlatform])

  const setTheme = useCallback((_next: AdminTheme) => {
    syncFromPlatform()
  }, [syncFromPlatform])

  const toggleTheme = useCallback(() => {
    syncFromPlatform()
  }, [syncFromPlatform])

  return (
    <AdminThemeContext.Provider value={{ theme, setTheme, toggleTheme, mounted }}>
      {children}
    </AdminThemeContext.Provider>
  )
}

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext)
  if (!ctx) throw new Error('useAdminTheme must be used within AdminThemeProvider')
  return ctx
}

interface AdminThemeToggleProps {
  variant?: 'sidebar' | 'compact' | 'toolbar'
}

/** Admin renkleri ayarlardan gelir; geçiş düğmesi yok */
export function AdminThemeToggle(_props: AdminThemeToggleProps) {
  return null
}
