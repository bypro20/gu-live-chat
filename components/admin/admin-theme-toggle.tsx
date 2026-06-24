'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'gu-admin-theme'

export type AdminTheme = 'dark' | 'light'

interface AdminThemeContextValue {
  theme: AdminTheme
  setTheme: (theme: AdminTheme) => void
  toggleTheme: () => void
  mounted: boolean
}

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null)

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>('light')
  const [mounted, setMounted] = useState(false)

  const syncThemeDom = useCallback((next: AdminTheme) => {
    document.querySelectorAll('.admin-shell-v2, .admin-overlay-host').forEach((el) => {
      el.setAttribute('data-admin-theme', next)
    })
  }, [])

  useEffect(() => {
    setThemeState('light')
    syncThemeDom('light')
    localStorage.setItem(STORAGE_KEY, 'light')
    setMounted(true)
  }, [syncThemeDom])

  const setTheme = useCallback((_next: AdminTheme) => {
    setThemeState('light')
    localStorage.setItem(STORAGE_KEY, 'light')
    syncThemeDom('light')
  }, [syncThemeDom])

  const toggleTheme = useCallback(() => {
    setThemeState('light')
    localStorage.setItem(STORAGE_KEY, 'light')
    syncThemeDom('light')
  }, [syncThemeDom])

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

export function AdminThemeToggle(_props: AdminThemeToggleProps) {
  return null
}
