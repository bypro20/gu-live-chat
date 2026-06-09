'use client'

import { useState, useEffect, useRef } from 'react'
import { SessionProvider, useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import NotificationBell from '@/components/dashboard/notification-bell'
import { AppLogo } from '@/components/brand/app-logo'
import { NativeBottomNav } from '@/components/app/native-bottom-nav'
import { useNativeApp } from '@/lib/hooks/use-native-app'
import { nativeAppHomePath } from '@/lib/native-app'

interface NavItem {
  href: string
  icon: string
  label: string
  badge: string | null
}

interface NavGroup {
  title: string
  items: NavItem[]
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { activeWebsite, websites, switchWebsite, isLoading: websitesLoading } = useActiveWebsite()
  const [websiteDropdownOpen, setWebsiteDropdownOpen] = useState(false)
  const [inboxUnread, setInboxUnread] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { isNativeApp } = useNativeApp()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      const callback = encodeURIComponent(pathname || '/dashboard')
      router.replace(`/login?callbackUrl=${callback}`)
    }
  }, [status, pathname, router])

  useEffect(() => {
    if (!activeWebsite?.websiteId || status !== 'authenticated') return
    if (pathname?.startsWith('/inbox')) return

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/inbox/unread?websiteId=${encodeURIComponent(activeWebsite.websiteId)}`
        )
        if (!res.ok) return
        const data = await res.json()
        setInboxUnread(data.unreadCount ?? 0)
      } catch {
        // polling fallback — sessizce devam
      }
    }
    poll()
    const id = setInterval(poll, 15000)
    return () => clearInterval(id)
  }, [activeWebsite?.websiteId, status, pathname])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/track-ip', { method: 'POST' }).catch(() => {})
    }
  }, [status])

  const isAdmin = session?.user?.role === 'ADMIN'

  const navGroups: NavGroup[] = [
    {
      title: 'Ana Sayfa',
      items: [
        { href: '/dashboard', icon: 'home', label: 'Genel Bakış', badge: null },
        { href: '/inbox', icon: 'inbox', label: 'Gelen Kutusu', badge: null },
        { href: '/contacts', icon: 'contacts', label: 'Kişiler', badge: null },
      ],
    },
    {
      title: 'İzleme & Analiz',
      items: [
        { href: '/analytics', icon: 'analytics', label: 'Analitik', badge: null },
        { href: '/visitors', icon: 'visitors', label: 'Ziyaretçiler', badge: null },
      ],
    },
    {
      title: 'İletişim',
      items: [
        { href: '/settings/widget', icon: 'widget', label: 'Sohbet Widget\'ı', badge: null },
        { href: '/settings/channels', icon: 'channels', label: 'Kanallar', badge: null },
      ],
    },
    {
      title: 'İçerik & Otomasyon',
      items: [
        { href: '/settings/knowledge', icon: 'book', label: 'Bilgi Bankası', badge: null },
        { href: '/settings/tickets', icon: 'ticket', label: 'Bilet Sistemi', badge: null },
        { href: '/settings/chatbot', icon: 'bot', label: 'Chatbot', badge: null },
        { href: '/settings/canned-responses', icon: 'message', label: 'Hazır Cevaplar', badge: null },
        { href: '/settings/ratings', icon: 'star', label: 'CSAT Puanları', badge: null },
        { href: '/settings/workflows', icon: 'workflow', label: 'Otomasyonlar', badge: null },
      ],
    },
    {
      title: 'Pazarlama',
      items: [
        { href: '/settings/campaigns', icon: 'campaign', label: 'Kampanyalar', badge: null },
      ],
    },
    {
      title: 'Yapılandırma',
      items: [
        { href: '/settings', icon: 'settings', label: 'Genel Ayarlar', badge: null },
        { href: '/settings/team', icon: 'team', label: 'Takım', badge: null },
        { href: '/settings/webhooks', icon: 'webhook', label: 'Webhook\'lar', badge: null },
        { href: '/settings/proactive', icon: 'proactive', label: 'Hedefli Mesajlar', badge: null },
        { href: '/settings/status-page', icon: 'status', label: 'Durum Sayfası', badge: null },
      ],
    },
    {
      title: 'Eklentiler',
      items: [
        { href: '/settings/addons', icon: 'puzzle', label: 'Eklenti Mağazası', badge: null },
      ],
    },
    {
      title: 'Abonelik',
      items: [
        { href: '/settings/billing', icon: 'billing', label: 'Faturalama', badge: null },
      ],
    },
    {
      title: 'Hesap',
      items: [
        { href: '/settings/privacy', icon: 'shield', label: 'Gizlilik & KVKK', badge: null },
      ],
    },
  ]

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push(isNativeApp ? '/login' : '/')
    router.refresh()
  }

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || session?.user?.email?.charAt(0)?.toUpperCase() || '?'

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setWebsiteDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/settings') return pathname === '/settings'
    return pathname.startsWith(href)
  }

  return (
    <div className={`app-shell h-screen flex overflow-hidden bg-background text-foreground ${isNativeApp ? 'native-app-shell' : ''}`}>
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside
        className={`app-sidebar relative fixed lg:static inset-y-0 left-0 z-50 flex flex-col transform transition-transform duration-200 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="relative h-[72px] flex items-center justify-between px-5 border-b border-[var(--sidebar-border)] shrink-0 gap-2">
          <AppLogo variant="sidebar" href="/dashboard" />
          <NotificationBell />
        </div>

        {activeWebsite && (
          <div className="px-3 pt-3 pb-2.5 border-b border-[var(--sidebar-border)] shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setWebsiteDropdownOpen(!websiteDropdownOpen)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group" style={{ background: 'rgba(255,255,255,0.035)', ['--hover-bg' as string]: 'rgba(255,255,255,0.06)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.035)' }}
            >
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm bg-primary/90">
                {activeWebsite.name?.charAt(0)?.toUpperCase() || 'W'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[12px] font-semibold text-white truncate">{activeWebsite.name}</p>
                <p className="text-[9px] truncate" style={{ color: 'var(--sidebar-foreground)' }}>{activeWebsite.domain || 'domain yok'}</p>
              </div>
              <svg className={`w-3 h-3 transition-all duration-200 shrink-0 ${websiteDropdownOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--sidebar-foreground)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {websiteDropdownOpen && websites.length > 1 && (
              <div className="mt-1.5 border rounded-xl shadow-2xl overflow-hidden z-50 animate-in-scale origin-top" style={{ background: '#13112A', borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="max-h-52 overflow-y-auto py-1">
                  {websites.map((w) => (
                    <button
                      key={w.websiteId}
                      onClick={() => {
                        switchWebsite(w.websiteId)
                        setWebsiteDropdownOpen(false)
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-all text-left`}
                      style={w.websiteId === activeWebsite.websiteId ? { background: 'var(--sidebar-active)' } : undefined}
                      onMouseEnter={(e) => { if (w.websiteId !== activeWebsite.websiteId) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                      onMouseLeave={(e) => { if (w.websiteId !== activeWebsite.websiteId) e.currentTarget.style.background = '' }}
                    >
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-primary/70">
                        {w.name?.charAt(0)?.toUpperCase() || 'W'}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[12px] font-medium text-white truncate">{w.name}</p>
                        <p className="text-[9px] truncate" style={{ color: 'var(--sidebar-foreground)' }}>{w.domain || 'domain yok'}</p>
                      </div>
                      {w.websiteId === activeWebsite.websiteId && (
                        <svg className="w-3.5 h-3.5 shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <nav className="relative flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="app-sidebar-group-label">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    badge={
                      item.href === '/inbox' && inboxUnread > 0
                        ? inboxUnread > 99
                          ? '99+'
                          : String(inboxUnread)
                        : item.badge
                    }
                    active={isActive(item.href)}
                  />
                ))}
              </div>
            </div>
          ))}

          {isAdmin && (
            <div>
              <div className="flex items-center gap-2 px-2.5 mb-1.5">
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'rgba(96,165,250,0.7)' }}>Yönetim</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(96,165,250,0.1)' }} />
              </div>
              <a
                href="/admin"
                className="flex items-center gap-2.5 px-3 py-[9px] rounded-lg transition-all duration-200 group relative"
                style={{ color: '#60A5FA' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(37,99,235,0.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
              >
                <svg className="w-[20px] h-[20px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285zm0 0A11.959 11.959 0 0112 2.25zm0 0c0 1.232-.21 2.413-.598 3.5m0 0c0 0 0 0 0 0m0 0l.187.188c.528.528 1.194.83 1.88.888m0 0A11.938 11.938 0 0012 2.25zm0 0L12 2.25zm0 0c.756 0 1.492.069 2.203.2" />
                </svg>
                <span className="flex-1 text-[14px] font-semibold tracking-wide" style={{ color: '#93C5FD' }}>Admin Paneli</span>
                <span className="px-2 py-0.5 text-[10px] font-bold text-white rounded-md bg-primary shadow-brand">ADMIN</span>
              </a>
            </div>
          )}
        </nav>

        <div className="relative p-3 border-t shrink-0 border-[var(--sidebar-border)]">
          {mounted && (
            <div className="flex items-center justify-end px-2.5 mb-2.5">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-200 cursor-pointer"
                style={{ color: 'var(--sidebar-foreground)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#E4E3ED'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sidebar-foreground)'; e.currentTarget.style.background = '' }}
              >
                {theme === 'dark' ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                {theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
              </button>
            </div>
          )}
          <div
            className="flex items-center gap-2.5 p-2 rounded-xl transition-all duration-200 group cursor-pointer relative"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.035)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '' }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate leading-tight">{session?.user?.name || 'Kullanıcı'}</p>
              <p className="text-[10px] truncate" style={{ color: 'var(--sidebar-foreground)' }}>{session?.user?.email}</p>
            </div>
            <div className={`flex items-center gap-0.5 ${isNativeApp ? 'hidden' : 'opacity-0 group-hover:opacity-100'} transition-all duration-200`}>
              {!isNativeApp && (
              <a href="/" className="p-1.5 rounded-md transition-all" style={{ color: 'var(--sidebar-foreground)' }} title="Siteye Dön"
                onMouseEnter={(e) => { e.currentTarget.style.color = '#E4E3ED'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sidebar-foreground)'; e.currentTarget.style.background = '' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h-2z" />
                </svg>
              </a>
              )}
              <button onClick={handleSignOut} className="p-1.5 rounded-md transition-all" style={{ color: 'var(--sidebar-foreground)' }} title="Çıkış Yap"
                onMouseEnter={(e) => { e.currentTarget.style.color = '#FB7185'; e.currentTarget.style.background = 'rgba(251,113,133,0.1)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sidebar-foreground)'; e.currentTarget.style.background = '' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className={`app-main flex-1 overflow-y-auto ${isNativeApp ? 'native-app-main' : ''}`}>
        <div className={`lg:hidden h-14 flex items-center justify-between px-4 gap-3 sticky top-0 z-30 glass-strong border-b border-border ${isNativeApp ? 'native-app-topbar' : ''}`}>
          <div className="flex items-center gap-3 min-w-0">
            {!isNativeApp && (
            <button onClick={() => setMobileMenuOpen(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            )}
            <AppLogo variant="light" size="sm" showTagline={false} />
          </div>
          <NotificationBell variant="toolbar" />
        </div>
        {children}
      </main>
      <NativeBottomNav />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  )
}

function SidebarLink({ href, icon, label, badge, active }: {
  href: string; icon: string; label: string; badge: string | null; active: boolean
}) {
  const icons: Record<string, React.ReactNode> = {
    home: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    inbox: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
      </svg>
    ),
    contacts: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    analytics: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    visitors: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    widget: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    channels: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    book: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    message: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    star: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    ticket: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-6-1.5h3m-3-3h3m-3-3h3m-3-3h3M3 12c0-1.464.367-2.842 1.015-4.04L3 6.75l2.25.75A8.976 8.976 0 0112 3c2.004 0 3.848.66 5.328 1.776L21 4.5l-1.015 2.21A8.978 8.978 0 0121 12c0 1.464-.367 2.842-1.015 4.04L21 17.25l-2.25-.75A8.976 8.976 0 0112 21a8.976 8.976 0 01-5.328-1.776L3 19.5l1.015-2.21A8.978 8.978 0 013 12z" />
      </svg>
    ),
    bot: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    workflow: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    ),
    settings: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    team: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    webhook: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    billing: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    puzzle: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    campaign: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.497.497 0 01-.673-.223 18.663 18.663 0 01-.367-.86m0-9.18c-.253-.962-.584-1.892-.985-2.783a.492.492 0 01.463-1.511l.657-.38a.497.497 0 01.673.223c.306.572.566 1.184.785 1.822m4.746-2.039l6.886 6.886a.75.75 0 010 1.06l-6.886 6.886a.75.75 0 01-1.06 0l-6.886-6.886a.75.75 0 010-1.06l6.886-6.886a.75.75 0 011.06 0z" />
      </svg>
    ),
    status: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
    shield: (
      <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  }

  return (
    <a
      href={href}
      className={`app-sidebar-link ${active ? 'app-sidebar-link--active' : ''}`}
    >
      <span className="shrink-0 opacity-90">{icons[icon]}</span>
      <span className="flex-1 tracking-wide">{label}</span>
      {badge && (
        <span className="app-sidebar-badge">{badge}</span>
      )}
    </a>
  )
}
