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
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminTopBar } from '@/components/admin/admin-top-bar'
import { AdminCommandPalette, useAdminCommandPalette } from '@/components/admin/admin-command-palette'
import { AdminThemeProvider, useAdminTheme, AdminThemeToggle } from '@/components/admin/admin-theme-toggle'
import { useToast } from '@/lib/toast'
import { useLiveVisitorNotify } from '@/lib/hooks/use-live-visitor-notify'
import { getAdminPageTitle } from '@/lib/admin-navigation'

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminThemeProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminThemeProvider>
  )
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inboxUnread, setInboxUnread] = useState(0)
  const [health, setHealth] = useState({ ok: true, db: true, socket: false })
  const [lastHealthCheck, setLastHealthCheck] = useState<Date>(new Date())
  const prevInboxUnreadRef = useRef(0)
  const inboxUnreadInitRef = useRef(false)
  const { isNativeAdminApp } = useNativeApp()
  const { toast } = useToast()
  const { open: paletteOpen, setOpen: setPaletteOpen, close: closePalette } = useAdminCommandPalette()
  const { liveCount: liveVisitorCount } = useLiveVisitorNotify({
    enabled: !!admin,
    variant: 'admin',
    userId: admin?.id,
  })
  const { theme: adminTheme } = useAdminTheme()

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
          router.push(isNativeAdminApp ? '/admin-login' : '/dashboard')
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
  }, [router, isNativeAdminApp])

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
        } else if (count > prevInboxUnreadRef.current && !pathname.startsWith('/admin/inbox')) {
          const delta = count - prevInboxUnreadRef.current
          playInboxNotificationSound()
          showDesktopNotification('Yeni widget mesajı', `${delta} okunmamış mesaj`)
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

      try {
        const res = await fetch('/api/health')
        if (res.ok) {
          const data = await res.json()
          setHealth({ ok: !!data.ok, db: !!data.db, socket: !!data.socket })
        }
        setLastHealthCheck(new Date())
      } catch {
        setHealth({ ok: false, db: false, socket: false })
      }
    }

    poll()
    const id = setInterval(poll, 15000)
    return () => clearInterval(id)
  }, [admin, pathname, toast])

  if (loading || !admin) {
    return (
      <div className="h-screen flex items-center justify-center admin-shell admin-shell-v2" data-admin-theme="dark" style={{ background: '#000' }}>
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

  const pageTitle = getAdminPageTitle(pathname || '')
  const isFullBleed =
    pathname.startsWith('/admin/inbox') || pathname.startsWith('/admin/customer-sites')

  return (
    <SessionProvider>
      <div
        className={`app-shell admin-shell admin-shell-v2 app-shell--mobile-nav relative lg:flex overflow-hidden admin-text ${
          isNativeAdminApp ? 'native-app-shell h-[100dvh]' : 'h-screen'
        }`}
        data-admin-theme={adminTheme}
        data-sidebar-open={sidebarOpen ? 'true' : 'false'}
      >
        <AdminCommandPalette open={paletteOpen} onClose={closePalette} />
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden touch-manipulation"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

        <div
          className={`fixed lg:static inset-y-0 left-0 z-50 h-full transform transition-transform duration-200 ease-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <AdminSidebar
            admin={{ name: admin.name, email: admin.email }}
            inboxUnread={inboxUnread}
            liveVisitorCount={liveVisitorCount}
            onSearchOpen={() => {
              setSidebarOpen(false)
              setPaletteOpen(true)
            }}
            onNavigate={() => setSidebarOpen(false)}
            onSignOut={() => void handleSignOut()}
            showCustomerLink={!isNativeAdminApp}
          />
        </div>

        <main
          className={`app-main admin-main absolute inset-0 lg:relative lg:flex-1 flex flex-col min-w-0 w-full h-full min-h-0 ${
            isNativeAdminApp ? 'native-app-main z-10' : ''
          } ${isFullBleed ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain'}`}
        >
          <AdminTopBar
            inboxUnread={inboxUnread}
            liveVisitorCount={liveVisitorCount}
            health={health}
            lastUpdated={lastHealthCheck}
            onSearchOpen={() => setPaletteOpen(true)}
          />

          {/* Mobil üst bar */}
          <div
            className={`admin-mobile-topbar lg:hidden shrink-0 h-14 flex items-center gap-2 px-3 sm:px-4 sticky top-0 z-30 border-b mobile-safe-area ${
              isNativeAdminApp ? 'native-app-topbar' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="admin-mobile-topbar-btn shrink-0 p-2 rounded-lg transition-colors touch-manipulation"
              aria-label="Menü"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/80 truncate">
                Admin
              </p>
              <p className="text-sm font-bold admin-text truncate">{pageTitle || 'Panel'}</p>
            </div>
            <AdminThemeToggle variant="compact" />
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="admin-mobile-topbar-btn p-2 rounded-lg touch-manipulation"
              aria-label="Ara"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
            <Link
              href="/admin/inbox"
              className="admin-mobile-topbar-btn relative p-2 rounded-lg touch-manipulation"
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
            <NotificationBell inboxBasePath="/admin/inbox" variant="toolbar" adminThemed />
          </div>

          <div
            className={`flex-1 min-h-0 min-w-0 ${isFullBleed ? 'overflow-hidden' : ''} ${
              isNativeAdminApp ? 'native-app-admin-content' : ''
            }`}
          >
            <div
              className={
                pathname.startsWith('/admin/inbox')
                  ? 'h-full min-h-0 flex flex-col'
                  : 'admin-content-root min-h-full'
              }
            >
              {children}
            </div>
          </div>

          {!isFullBleed && (
            <AdminMobileBottomNav
              inboxUnread={inboxUnread}
              liveVisitorCount={liveVisitorCount}
              onOpenMenu={() => setSidebarOpen(true)}
            />
          )}
        </main>
      </div>
    </SessionProvider>
  )
}
