'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Search, RefreshCw, Bell, Eye, Wifi, Database, Radio,
} from 'lucide-react'
import NotificationBell from '@/components/dashboard/notification-bell'
import { getAdminPageTitle } from '@/lib/admin-navigation'
import { AdminThemeToggle } from '@/components/admin/admin-theme-toggle'

interface AdminTopBarProps {
  inboxUnread: number
  liveVisitorCount: number
  health: { ok: boolean; db: boolean; socket: boolean }
  lastUpdated?: Date
  onSearchOpen: () => void
  onRefresh?: () => void
  mobileMenu?: React.ReactNode
}

export function AdminTopBar({
  inboxUnread,
  liveVisitorCount,
  health,
  lastUpdated,
  onSearchOpen,
  onRefresh,
  mobileMenu,
}: AdminTopBarProps) {
  const pathname = usePathname() || ''
  const pageTitle = getAdminPageTitle(pathname)

  return (
    <header className="admin-top-bar hidden lg:flex shrink-0 items-center gap-4 px-6 h-14 border-b sticky top-0 z-20">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400/80 mb-0.5">
          Platform Yönetimi
        </p>
        <h1 className="text-base font-bold admin-text truncate">
          {pageTitle || 'Admin Panel'}
        </h1>
      </div>

      <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border admin-health-pill text-[11px]">
        <span className={`flex items-center gap-1 ${health.ok ? 'text-emerald-400' : 'text-red-400'}`}>
          <Wifi className="w-3 h-3" /> API
        </span>
        <span className="admin-text-faint">|</span>
        <span className={`flex items-center gap-1 ${health.db ? 'text-emerald-400' : 'text-red-400'}`}>
          <Database className="w-3 h-3" /> DB
        </span>
        <span className="admin-text-faint">|</span>
        <span className={`flex items-center gap-1 ${health.socket ? 'text-emerald-400' : 'text-amber-400'}`}>
          <Radio className="w-3 h-3" /> Canlı
        </span>
        {lastUpdated && (
          <>
            <span className="admin-text-faint">|</span>
            <span className="admin-text-muted tabular-nums">
              {lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onSearchOpen}
          className="admin-toolbar-search flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="hidden xl:inline">Ara</span>
          <kbd className="hidden xl:inline text-[10px] admin-text-faint border rounded px-1.5 py-0.5 ml-1" style={{ borderColor: 'var(--admin-border)' }}>⌘K</kbd>
        </button>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="admin-toolbar-btn p-2.5 rounded-xl border transition-colors"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <Link
          href="/admin/visitors"
          className="admin-toolbar-btn relative p-2.5 rounded-xl border transition-colors"
          title="Ziyaretçi Takibi"
        >
          <Eye className="w-4 h-4" />
          {liveVisitorCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-0.5 flex items-center justify-center text-[9px] font-bold bg-emerald-500 text-white rounded-full">
              {liveVisitorCount > 99 ? '99+' : liveVisitorCount}
            </span>
          )}
        </Link>

        <Link
          href="/admin/inbox"
          className="admin-toolbar-btn relative p-2.5 rounded-xl border transition-colors"
          title="Gelen Kutusu"
        >
          <Bell className="w-4 h-4" />
          {inboxUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-0.5 flex items-center justify-center text-[9px] font-bold bg-violet-500 text-white rounded-full">
              {inboxUnread > 99 ? '99+' : inboxUnread}
            </span>
          )}
        </Link>

        <NotificationBell inboxBasePath="/admin/inbox" variant="toolbar" />
        <AdminThemeToggle variant="toolbar" />
      </div>

      {mobileMenu}
    </header>
  )
}
