'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export type NavLeaf = { href: string; label: string; hint?: string; badge?: string | null; match?: (p: string) => boolean }
export type NavGroup = { label: string; children: NavLeaf[] }
export type NavEntry = NavLeaf | NavGroup

const isGroup = (e: NavEntry): e is NavGroup => 'children' in e

export function PanelTopNav({
  logo,
  entries,
  pathname,
  right,
  exactHrefs = ['/dashboard', '/admin', '/settings'],
}: {
  logo: ReactNode
  entries: NavEntry[]
  pathname: string
  right: ReactNode
  exactHrefs?: string[]
}) {
  const [open, setOpen] = useState<string | null>(null)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    setOpen(null)
  }, [pathname])
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const leafActive = (l: NavLeaf) =>
    l.match ? l.match(pathname) : exactHrefs.includes(l.href) ? pathname === l.href : pathname === l.href || pathname.startsWith(l.href + '/')

  return (
    <header ref={ref} className="ptn hidden lg:flex" role="banner">
      <div className="ptn-logo">{logo}</div>
      <nav className="ptn-links" aria-label="Ana menü">
        {entries.map((e) => {
          if (!isGroup(e)) {
            const active = leafActive(e)
            return (
              <Link key={e.href} href={e.href} className={`ptn-link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}>
                {e.label}
                {e.badge && <span className="ptn-badge">{e.badge}</span>}
              </Link>
            )
          }
          const active = e.children.some(leafActive)
          const isOpen = open === e.label
          const groupBadge = e.children.find((c) => c.badge)?.badge
          return (
            <div key={e.label} className="relative">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="menu"
                onClick={() => setOpen(isOpen ? null : e.label)}
                className={`ptn-link ${active ? 'is-active' : ''}`}
              >
                {e.label}
                {groupBadge && <span className="ptn-badge">{groupBadge}</span>}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div role="menu" className="ptn-menu">
                  {e.children.map((c) => (
                    <Link key={c.href} href={c.href} role="menuitem" className={`ptn-item ${leafActive(c) ? 'is-active' : ''}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{c.label}</span>
                        {c.hint && <span className="ptn-hint block truncate">{c.hint}</span>}
                      </span>
                      {c.badge && <span className="ptn-badge">{c.badge}</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <div className="ptn-right">{right}</div>
    </header>
  )
}

/** Avatar menüsü: kullanıcı, siteye git, tema, çıkış. */
export function AvatarMenu({
  initial,
  name,
  email,
  items,
}: {
  initial: string
  name?: string | null
  email?: string | null
  items: { label: string; href?: string; onClick?: () => void; danger?: boolean }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" className="ptn-avatar" title={name ?? ''}>
        {initial}
      </button>
      {open && (
        <div role="menu" className="ptn-menu right-0 left-auto w-64">
          <div className="border-b border-[var(--ptn-line)] px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="ptn-hint truncate">{email}</p>
          </div>
          {items.map((it) =>
            it.href ? (
              <a key={it.label} href={it.href} role="menuitem" className="ptn-item">
                {it.label}
              </a>
            ) : (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  it.onClick?.()
                }}
                className={`ptn-item w-full text-left ${it.danger ? 'is-danger' : ''}`}
              >
                {it.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
