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

function readStoredTheme(): AdminTheme {
  if (typeof window === 'undefined') return 'light'
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

function syncAdminThemeDom(mode: AdminTheme) {
  document.querySelectorAll('.admin-shell-v2, .admin-overlay-host').forEach((el) => {
    el.setAttribute('data-admin-theme', mode)
  })
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>(() => readStoredTheme())
  const [mounted, setMounted] = useState(false)

  const applyTheme = useCallback((next: AdminTheme) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
    syncAdminThemeDom(next)
  }, [])

  useEffect(() => {
    const stored = readStoredTheme()
    applyTheme(stored)
    setMounted(true)
  }, [applyTheme])

  const setTheme = useCallback(
    (next: AdminTheme) => {
      applyTheme(next)
    },
    [applyTheme],
  )

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, next)
      syncAdminThemeDom(next)
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
  const label = isDark ? 'Aydınlık moda geç' : 'Karanlık moda geç'

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
        <span className="block text-[13px] font-semibold admin-sidebar-title">
          {isDark ? 'Aydınlık mod' : 'Karanlık mod'}
        </span>
        <span className="block text-[10px] admin-sidebar-desc">
          {isDark ? 'Beyaz arka plana geç' : 'Siyah arka plana geç'}
        </span>
      </span>
    </button>
  )
}
