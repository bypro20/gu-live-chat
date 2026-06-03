'use client'

import { useState, useEffect, useRef } from 'react'
import { SessionProvider, useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import NotificationBell from '@/components/dashboard/notification-bell'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { activeWebsite, websites, switchWebsite, isLoading: websitesLoading } = useActiveWebsite()
  const [websiteDropdownOpen, setWebsiteDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  const isAdmin = session?.user?.role === 'ADMIN'

  const navItems = [
    { href: '/dashboard', icon: 'home', label: 'Genel Bakış', badge: null },
    { href: '/inbox', icon: 'inbox', label: 'Gelen Kutusu', badge: null },
    { href: '/analytics', icon: 'analytics', label: 'Analitik', badge: null },
    { href: '/visitors', icon: 'visitors', label: 'Ekran İzleme', badge: null },
    { href: '/contacts', icon: 'contacts', label: 'Kişiler', badge: null },
    { href: '/settings', icon: 'settings', label: 'Ayarlar', badge: null },
    { href: '/settings/widget', icon: 'widget', label: 'Widget', badge: null },
    { href: '/settings/team', icon: 'team', label: 'Takım', badge: null },
    { href: '/settings/chatbot', icon: 'bot', label: 'Chatbot', badge: null },
    { href: '/settings/billing', icon: 'billing', label: 'Faturalama', badge: null },
    { href: '/settings/webhooks', icon: 'webhook', label: 'Webhook\'lar', badge: null },
  ]

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  const userInitial = session?.user?.name?.charAt(0)?.toUpperCase() || session?.user?.email?.charAt(0)?.toUpperCase() || '?'

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Close website dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setWebsiteDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="h-screen flex overflow-hidden bg-[#F0EDFF] dark:bg-[#0a0a12]">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-gradient-to-b from-[#0F0A1E] to-[#1A1D2E] flex flex-col transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="h-[60px] flex items-center px-5 border-b border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-[#6C3CE1] to-[#8B5CF6] rounded-xl flex items-center justify-center shadow-lg shadow-[#6C3CE1]/30 group-hover:shadow-[#6C3CE1]/50 transition-shadow">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            </div>
            <div>
              <span className="text-white font-bold text-[15px] tracking-tight">Gu Live Chat</span>
            </div>
          </Link>
        </div>

        {/* Website Switcher */}
        {activeWebsite && (
          <div className="px-3 py-2 border-b border-white/[0.06]" ref={dropdownRef}>
            <button
              onClick={() => setWebsiteDropdownOpen(!websiteDropdownOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition group"
            >
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#6C3CE1]/80 to-[#8B5CF6]/80 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {activeWebsite.name?.charAt(0)?.toUpperCase() || 'W'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[12px] font-medium text-white truncate">{activeWebsite.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{activeWebsite.domain}</p>
              </div>
              <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${websiteDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {websiteDropdownOpen && websites.length > 1 && (
              <div className="mt-1 bg-[#1E1B2E] border border-white/[0.08] rounded-lg shadow-xl overflow-hidden z-50">
                <div className="max-h-48 overflow-y-auto">
                  {websites.map((w) => (
                    <button
                      key={w.websiteId}
                      onClick={() => {
                        switchWebsite(w.websiteId)
                        setWebsiteDropdownOpen(false)
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.06] transition text-left ${
                        w.websiteId === activeWebsite.websiteId ? 'bg-[#6C3CE1]/15' : ''
                      }`}
                    >
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#6C3CE1]/60 to-[#8B5CF6]/60 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {w.name?.charAt(0)?.toUpperCase() || 'W'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-white truncate">{w.name}</p>
                        <p className="text-[9px] text-gray-400 truncate">{w.domain}</p>
                      </div>
                      {w.websiteId === activeWebsite.websiteId && (
                        <svg className="w-3.5 h-3.5 text-[#6C3CE1] shrink-0" fill="currentColor" viewBox="0 0 20 20">
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

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <SidebarLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              active={pathname === item.href}
            />
          ))}

          {isAdmin && (
            <>
              <div className="pt-3 mt-3 border-t border-white/[0.06]">
                <p className="px-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Yönetim</p>
              </div>
              <a href="/admin" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all group">
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="flex-1 text-[13px] font-medium">Admin Paneli</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-rose-500 to-red-500 text-white rounded">ADMIN</span>
              </a>
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-white/[0.06]">
          {/* Notification Bell + Theme Toggle */}
          <div className="flex items-center justify-between px-2 mb-2">
            <NotificationBell />
            {mounted && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500">Tema</span>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.08] transition"
                  title={theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
                >
                  {theme === 'dark' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.06] transition group">
            <div className="w-9 h-9 bg-gradient-to-br from-[#6C3CE1] to-[#8B5CF6] rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg shadow-[#6C3CE1]/30">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{session?.user?.name || 'Kullanıcı'}</p>
              <p className="text-[11px] text-gray-400 truncate">{session?.user?.email}</p>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <a href="/" className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.08] transition" title="Siteye Dön">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h-2z" />
                </svg>
              </a>
              <button onClick={handleSignOut} className="p-1.5 rounded-md text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition" title="Çıkış Yap">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#F0EDFF] dark:bg-[#0a0a12]">
        {/* Mobile top bar */}
        <div className="lg:hidden h-14 bg-white dark:bg-[#1a1d2e] border-b border-[#E5E0F0] dark:border-gray-700 flex items-center px-4 gap-3 sticky top-0 z-30">
          <button onClick={() => setMobileMenuOpen(true)} className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#6C3CE1] to-[#8B5CF6] rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">Gu Live Chat</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    inbox: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
    analytics: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    contacts: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    settings: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    widget: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    team: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    bot: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    billing: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    webhook: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    visitors: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  }

  return (
    <a
      href={href}
      className={`flex items-center gap-2.5 px-3 py-[9px] rounded-lg transition-all duration-150 group relative ${
        active
          ? 'bg-[#6C3CE1]/15 text-[#A78BFA]'
          : 'text-gray-400 hover:bg-white/[0.06] hover:text-gray-200'
      }`}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#6C3CE1] rounded-r-full shadow-[0_0_8px_rgba(108,60,225,0.5)]" />
      )}
      <span className="shrink-0">{icons[icon]}</span>
      <span className="flex-1 text-[13px] font-medium">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#6C3CE1] text-white rounded-full min-w-[18px] text-center shadow-md shadow-[#6C3CE1]/30">
          {badge}
        </span>
      )}
    </a>
  )
}