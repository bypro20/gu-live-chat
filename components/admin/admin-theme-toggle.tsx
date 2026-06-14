'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

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
  const [theme, setThemeState] = useState<AdminTheme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    setThemeState(stored === 'light' ? 'light' : 'dark')
    setMounted(true)
  }, [])

  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

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

export function AdminThemeToggle({ variant = 'sidebar' }: AdminThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useAdminTheme()

  if (!mounted) {
    return (
      <div
        className={
          variant === 'compact' || variant === 'toolbar'
            ? 'w-9 h-9 rounded-xl animate-pulse'
            : 'h-10 rounded-xl animate-pulse'
        }
        style={{ background: 'var(--admin-bg-hover)' }}
      />
    )
  }

  const isDark = theme === 'dark'
  const label = isDark ? 'Aydınlık mod' : 'Karanlık mod'

  if (variant === 'compact' || variant === 'toolbar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="admin-theme-toggle admin-theme-toggle--compact"
        title={label}
        aria-label={label}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="admin-theme-toggle admin-theme-toggle--sidebar w-full"
      aria-label={label}
    >
      <span className="admin-theme-toggle-icon">
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </span>
      <span className="flex-1 text-left">
        <span className="block text-[13px] font-semibold admin-text">{label}</span>
        <span className="block text-[10px] admin-text-muted">
          {isDark ? 'Siyah arka plan' : 'Açık arka plan'}
        </span>
      </span>
    </button>
  )
}
