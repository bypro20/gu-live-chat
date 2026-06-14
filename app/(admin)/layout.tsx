'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SessionProvider, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  playInboxNotificationSound,
  requestDesktopNotificationPermission,
  showDesktopNotification,
} from '@/lib/inbox-sound'
import { AppLogo } from '@/components/brand/app-logo'
import NotificationBell from '@/components/dashboard/notification-bell'
import { useNativeApp } from '@/lib/hooks/use-native-app'
import { clearNativeAppMark } from '@/lib/native-app'
import { AdminMobileBottomNav } from '@/components/admin/admin-mobile-bottom-nav'
import { useToast } from '@/lib/toast'

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inboxUnread, setInboxUnread] = useState(0)
  const prevInboxUnreadRef = useRef(0)
  const inboxUnreadInitRef = useRef(false)
  const { isNativeAdminApp } = useNativeApp()
  const { toast } = useToast()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    clearNativeAppMark()
    router.push(isNativeAdminApp ? '/admin-login' : '/')
    router.refresh()
  }

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/admin/me')
        if (!res.ok) {
          router.push('/admin-login')
          return
        }
        const data = await res.json()
        if (data.role !== 'ADMIN') {
          if (isNativeAdminApp) {
            router.push('/admin-login')
          } else {
            router.push('/dashboard')
          }
          return
        }
        setAdmin(data)
        fetch('/api/admin/marketing-website').catch(() => {})
      } catch {
        router.push('/admin-login')
      } finally {
        setLoading(false)
      }
    }
    checkAdmin()
  }, [router])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!admin) return

    requestDesktopNotificationPermission()

    const poll = async () => {
      try {
        const res = await fetch('/api/admin/inbox-unread')
        if (!res.ok) return
        const data = await res.json()
        const count = Number(data.unreadCount) || 0
        setInboxUnread(count)

        if (!inboxUnreadInitRef.current) {
          inboxUnreadInitRef.current = true
          prevInboxUnreadRef.current = count
          return
        }

        if (count > prevInboxUnreadRef.current && !pathname.startsWith('/admin/inbox')) {
          const delta = count - prevInboxUnreadRef.current
          playInboxNotificationSound()
          showDesktopNotification(
            'Yeni widget mesajı',
            `${delta} okunmamış mesaj`
          )
          toast({
            title: 'Yeni mesaj',
            description: `${delta} okunmamış mesaj var`,
            variant: 'info',
            duration: 6000,
          })
        }
        prevInboxUnreadRef.current = count
      } catch {
        // ignore
      }
    }

    poll()
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [admin, pathname, toast])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#080C14]">
        <div className="flex flex-col items-center gap-4">
          <AppLogo variant="admin" showTagline={false} size="lg" />
          <div className="flex items-center gap-3 text-white/50 text-sm">
            <svg className="animate-spin h-5 w-5 text-violet-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Yükleniyor…
          </div>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: '/admin', icon: 'dashboard', label: 'Genel Bakış' },
    { href: '/admin/platform', icon: 'platform', label: 'Platform Merkezi' },
    { href: '/admin/conversations', icon: 'conversations', label: 'Tüm Sohbetler' },
    { href: '/admin/marketing', icon: 'settings', label: 'Pazarlama' },
    { href: '/admin/inbox', icon: 'inbox', label: 'Gelen Kutusu' },
    { href: '/admin/visitors', icon: 'visitors', label: 'Ekran İzleme' },
    { href: '/admin/users', icon: 'users', label: 'Kullanıcılar' },
    { href: '/admin/ip-bans', icon: 'ipbans', label: 'IP Engelleme' },
    { href: '/admin/websites', icon: 'websites', label: 'Siteler' },
    { href: '/admin/widget', icon: 'widget', label: 'Sohbet Widget' },
    { href: '/admin/settings', icon: 'settings', label: 'Ayarlar' },
  ]

  const userInitial = admin?.name?.charAt(0)?.toUpperCase() || 'A'

  return (
    <SessionProvider>
      <div
        className={`app-shell admin-shell app-shell--mobile-nav relative lg:flex overflow-hidden text-white ${
          isNativeAdminApp ? 'native-app-shell h-[100dvh]' : 'h-screen'
        }`}
        data-sidebar-open={sidebarOpen ? 'true' : 'false'}
      >
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden touch-manipulation"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

        <aside
          className={`app-sidebar fixed lg:static inset-y-0 left-0 z-50 flex flex-col h-full transform transition-transform duration-200 ease-out ${
            sidebarOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none lg:translate-x-0 lg:pointer-events-auto'
          }`}
        >
          <div className="relative h-[72px] flex items-center justify-between px-5 border-b border-[var(--sidebar-border)] shrink-0 gap-2">
            <AppLogo variant="admin" href="/admin" />
            <NotificationBell inboxBasePath="/admin/inbox" />
          </div>

          <nav className="relative flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <p className="app-sidebar-group-label mb-3">Yönetim</p>
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                badge={item.href === '/admin/inbox' && inboxUnread > 0 ? inboxUnread : undefined}
                active={
                  pathname === item.href ||
                  (item.href === '/admin/inbox' && pathname.startsWith('/admin/inbox'))
                }
                onNavigate={() => setSidebarOpen(false)}
              />
            ))}

            {!isNativeAdminApp && (
            <div className="pt-5 mt-5 border-t border-white/[0.06]">
              <p className="app-sidebar-group-label mb-2">Geçiş</p>
              <NavLink href="/dashboard" icon="back" label="Müşteri Paneli" active={false} />
            </div>
            )}
          </nav>

          <div className="relative p-3 border-t border-[var(--sidebar-border)] shrink-0 native-sidebar-footer">
            <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.04] transition-colors group">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{admin?.name || 'Admin'}</p>
                <p className="text-[10px] text-white/40 truncate">{admin?.email}</p>
              </div>
              <button
                onClick={() => void handleSignOut()}
                className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors lg:opacity-0 lg:group-hover:opacity-100"
                title="Çıkış Yap"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="lg:hidden w-full mt-2 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[13px] font-semibold text-white bg-red-500/90 hover:bg-red-500 transition-all"
            >
              Çıkış Yap
            </button>
          </div>
        </aside>

        <main
          className={`app-main absolute inset-0 lg:relative lg:flex-1 flex flex-col min-w-0 w-full h-full min-h-0 text-white ${
            isNativeAdminApp ? 'native-app-main z-10' : ''
          } ${
            pathname.startsWith('/admin/inbox')
              ? 'overflow-hidden'
              : 'overflow-y-auto overscroll-contain'
          }`}
        >
          <div
            className={`lg:hidden shrink-0 h-14 flex items-center gap-2 px-3 sm:px-4 sticky top-0 z-30 glass-strong border-b border-border mobile-safe-area ${
              isNativeAdminApp ? 'native-app-topbar' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer touch-manipulation"
              aria-label="Menü"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 min-w-0 overflow-hidden">
              <AppLogo variant="admin" size="sm" showTagline={false} className="max-w-full" />
            </div>
            <div className="shrink-0 flex items-center gap-1">
              <Link
                href="/admin/inbox"
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors touch-manipulation"
                aria-label="Gelen Kutusu"
                title="Gelen Kutusu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {inboxUnread > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[1rem] h-4 px-0.5 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {inboxUnread > 99 ? '99+' : inboxUnread}
                  </span>
                )}
              </Link>
              <NotificationBell inboxBasePath="/admin/inbox" variant="toolbar" />
            </div>
          </div>
          <div
            className={`flex-1 min-h-0 min-w-0 ${
              pathname.startsWith('/admin/inbox') ? 'overflow-hidden' : 'overflow-visible'
            } ${isNativeAdminApp ? 'native-app-admin-content' : ''}`}
          >
            {children}
          </div>
          {!pathname.startsWith('/admin/inbox') && (
            <AdminMobileBottomNav
              inboxUnread={inboxUnread}
              onOpenMenu={() => setSidebarOpen(true)}
            />
          )}
        </main>
      </div>
    </SessionProvider>
  )
}

function NavLink({
  href,
  icon,
  label,
  active,
  badge,
  onNavigate,
}: {
  href: string
  icon: string
  label: string
  active: boolean
  badge?: number
  onNavigate?: () => void
}) {
  const icons: Record<string, React.ReactNode> = {
    dashboard: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    users: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    websites: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    settings: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    back: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    ),
    visitors: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    ipbans: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    inbox: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    widget: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    platform: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6.75v6.75" />
      </svg>
    ),
    conversations: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`app-sidebar-link touch-manipulation min-h-[44px] ${active ? 'app-sidebar-link--active' : ''}`}
    >
      <span className="shrink-0 opacity-90">{icons[icon]}</span>
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="app-sidebar-badge">{badge > 99 ? '99+' : badge}</span>
      )}
    </Link>
  )
}
