'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Tab = {
  href?: string
  label: string
  match?: (p: string) => boolean
  icon: React.ReactNode
  badge?: number
  onClick?: () => void
}

export function AdminMobileBottomNav({
  inboxUnread = 0,
  onOpenMenu,
}: {
  inboxUnread?: number
  onOpenMenu?: () => void
}) {
  const pathname = usePathname()

  const tabs: Tab[] = [
    {
      href: '/admin',
      label: 'Panel',
      match: (p) => p === '/admin',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      href: '/admin/inbox',
      label: 'Gelen Kutusu',
      match: (p) => p.startsWith('/admin/inbox'),
      badge: inboxUnread,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      href: '/admin/visitors',
      label: 'Ziyaretçi',
      match: (p) => p.startsWith('/admin/visitors'),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Menü',
      onClick: onOpenMenu,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      ),
    },
  ]

  return (
    <nav className="mobile-web-bottom-nav admin-mobile-bottom-nav lg:hidden" aria-label="Admin menü">
      <div className="mobile-web-bottom-nav-inner">
        {tabs.map((tab) => {
          const active = tab.match?.(pathname || '') ?? false
          const content = (
            <>
              <span className="relative mobile-web-tab-icon">
                {tab.icon}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[1rem] h-4 px-0.5 flex items-center justify-center text-[9px] font-bold bg-violet-500 text-white rounded-full">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </span>
              <span className="mobile-web-tab-label">{tab.label}</span>
            </>
          )

          if (tab.href) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`mobile-web-tab touch-manipulation ${active ? 'mobile-web-tab--active' : ''}`}
              >
                {content}
              </Link>
            )
          }

          return (
            <button
              key={tab.label}
              type="button"
              onClick={tab.onClick}
              className="mobile-web-tab touch-manipulation"
              aria-label={tab.label}
            >
              {content}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
