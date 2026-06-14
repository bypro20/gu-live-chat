'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'
import { getAdminNavFlat, type AdminNavItem } from '@/lib/admin-navigation'
import { useAdminTheme } from '@/components/admin/admin-theme-toggle'

interface AdminCommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function AdminCommandPalette({ open, onClose }: AdminCommandPaletteProps) {
  const router = useRouter()
  const { theme } = useAdminTheme()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const all = getAdminNavFlat()
    if (!q) return all
    return all.filter((item) => {
      const haystack = [item.label, item.description, ...(item.keywords || [])].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [query])

  const go = useCallback(
    (item: AdminNavItem) => {
      onClose()
      setQuery('')
      router.push(item.href)
    },
    [onClose, router]
  )

  useEffect(() => {
    if (!open) return
    setActiveIndex(0)
    setQuery('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && items[activeIndex]) {
        e.preventDefault()
        go(items[activeIndex])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, items, activeIndex, go, onClose])

  if (!open) return null

  return (
    <div
      className="admin-overlay-host fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh] sm:pt-[15vh]"
      data-admin-theme={theme}
      role="dialog"
      aria-modal="true"
      aria-label="Admin arama"
    >
      <button
        type="button"
        className="admin-command-palette-overlay absolute inset-0 backdrop-blur-sm"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div className="admin-command-palette relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden animate-in-scale">
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--admin-border)' }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--admin-accent)' }} />
          <input
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            placeholder="Sayfa, modül veya işlem ara… (Esc ile kapat)"
            className="admin-command-palette-input flex-1 text-sm outline-none border-0 p-0 min-w-0 bg-transparent"
            style={{ color: 'var(--admin-text)' }}
          />
          <kbd
            className="hidden sm:inline text-[10px] admin-text-faint border rounded px-1.5 py-0.5"
            style={{ borderColor: 'var(--admin-border)' }}
          >
            ↵
          </kbd>
        </div>
        <div
          className="max-h-[min(420px,50vh)] overflow-y-auto py-2 admin-command-palette-results"
          style={{ color: 'var(--admin-text)' }}
        >
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm" style={{ color: 'var(--admin-text-muted)' }}>
              Sonuç bulunamadı
            </p>
          ) : (
            items.map((item, index) => (
              <button
                key={item.href}
                type="button"
                onClick={() => go(item)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`admin-command-palette-item w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  index === activeIndex ? 'admin-command-palette-item--active' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold admin-text">{item.label}</p>
                  <p className="text-xs admin-text-muted truncate">{item.description}</p>
                </div>
                <ArrowRight
                  className="w-4 h-4 shrink-0"
                  style={{ color: index === activeIndex ? 'var(--admin-accent)' : 'var(--admin-text-faint)' }}
                />
              </button>
            ))
          )}
        </div>
        <div
          className="px-4 py-2 border-t admin-text-faint text-[10px] flex items-center gap-3"
          style={{ borderColor: 'var(--admin-border)' }}
        >
          <span>↑↓ gezin</span>
          <span>↵ aç</span>
          <span>Esc kapat</span>
        </div>
      </div>
    </div>
  )
}

/** Global Cmd+K / Ctrl+K listener */
export function useAdminCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return { open, setOpen, close: () => setOpen(false) }
}
