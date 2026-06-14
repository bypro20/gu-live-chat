'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BarChart3, Inbox, Eye, MessageSquare, Users, Globe,
  UserCog, Monitor, Megaphone, ShieldBan, Settings, Search, ArrowLeft,
} from 'lucide-react'
import { AppLogo } from '@/components/brand/app-logo'
import NotificationBell from '@/components/dashboard/notification-bell'
import {
  ADMIN_NAV_GROUPS,
  isAdminNavActive,
  type AdminBadgeKey,
  type AdminNavItem,
} from '@/lib/admin-navigation'
import { AdminThemeToggle } from '@/components/admin/admin-theme-toggle'

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  platform: BarChart3,
  inbox: Inbox,
  visitors: Eye,
  conversations: MessageSquare,
  customers: UserCog,
  users: Users,
  websites: Globe,
  widget: Monitor,
  marketing: Megaphone,
  ipbans: ShieldBan,
  settings: Settings,
}

interface AdminSidebarProps {
  admin: { name: string | null; email: string }
  inboxUnread: number
  liveVisitorCount: number
  onSearchOpen: () => void
  onNavigate?: () => void
  onSignOut: () => void
  showCustomerLink?: boolean
}

function getBadge(
  item: AdminNavItem,
  badges: Record<AdminBadgeKey, number>
): number | undefined {
  if (!item.badge) return undefined
  const n = badges[item.badge]
  return n > 0 ? n : undefined
}

export function AdminSidebar({
  admin,
  inboxUnread,
  liveVisitorCount,
  onSearchOpen,
  onNavigate,
  onSignOut,
  showCustomerLink = true,
}: AdminSidebarProps) {
  const pathname = usePathname() || ''
  const [filter, setFilter] = useState('')

  const badges: Record<AdminBadgeKey, number> = {
    inbox: inboxUnread,
    visitors: liveVisitorCount,
  }

  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return ADMIN_NAV_GROUPS
    return ADMIN_NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        const hay = [item.label, item.description, ...(item.keywords || [])].join(' ').toLowerCase()
        return hay.includes(q)
      }),
    })).filter((g) => g.items.length > 0)
  }, [filter])

  const userInitial = admin.name?.charAt(0)?.toUpperCase() || 'A'

  return (
    <aside className="admin-sidebar app-sidebar flex flex-col h-full w-[var(--app-sidebar-width)]">
      <div className="admin-sidebar-header">
        <AppLogo variant="admin" href="/admin" />
        <NotificationBell inboxBasePath="/admin/inbox" />
      </div>

      <div className="px-3 pt-3 pb-2 shrink-0">
        <button
          type="button"
          onClick={onSearchOpen}
          className="admin-sidebar-search-trigger w-full"
        >
          <Search className="w-4 h-4 shrink-0 admin-sidebar-icon" />
          <span className="flex-1 text-left text-sm admin-sidebar-desc">Ara veya git…</span>
          <kbd className="hidden xl:inline text-[10px] admin-sidebar-muted border rounded px-1.5 py-0.5" style={{ borderColor: 'var(--sidebar-border)' }}>⌘K</kbd>
        </button>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 admin-sidebar-icon pointer-events-none" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Menüde filtrele…"
            className="admin-sidebar-filter w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none focus:ring-1"
          />
        </div>
      </div>

      <nav className="admin-sidebar-nav flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {groups.map((group) => (
          <div key={group.id}>
            <p className="admin-sidebar-group-label">{group.label}</p>
            <div className="space-y-0.5 mt-1.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon] || LayoutDashboard
                const active = isAdminNavActive(item, pathname)
                const badge = getBadge(item, badges)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`admin-sidebar-item ${active ? 'admin-sidebar-item--active' : ''}`}
                  >
                    <span className={`admin-sidebar-item-icon ${active ? 'text-violet-300' : ''}`}>
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold truncate">{item.label}</span>
                        {badge != null && (
                          <span className="admin-sidebar-badge">{badge > 99 ? '99+' : badge}</span>
                        )}
                      </span>
                      <span className="block text-[10px] admin-sidebar-desc truncate leading-tight mt-0.5">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="text-xs admin-sidebar-muted text-center py-6">Eşleşen menü yok</p>
        )}
      </nav>

      <div className="admin-sidebar-footer shrink-0 space-y-2">
        <AdminThemeToggle variant="sidebar" />
        {showCustomerLink && (
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="admin-sidebar-item mb-2 text-sky-400/90 hover:text-sky-300"
          >
            <span className="admin-sidebar-item-icon">
              <ArrowLeft className="w-[18px] h-[18px]" />
            </span>
            <span className="text-[13px] font-medium">Müşteri Paneli</span>
          </Link>
        )}
        <div className="flex items-center gap-2.5 p-2 rounded-xl transition-colors group hover:bg-[var(--sidebar-surface-hover)]">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold admin-sidebar-title truncate">{admin.name || 'Admin'}</p>
            <p className="text-[10px] admin-sidebar-muted truncate">{admin.email}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors hidden lg:block"
            title="Çıkış Yap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="lg:hidden w-full mt-2 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[13px] font-semibold text-white bg-red-500/90 hover:bg-red-500 transition-all"
        >
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
