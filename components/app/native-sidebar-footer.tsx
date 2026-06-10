'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useNativeApp } from '@/lib/hooks/use-native-app'

interface NativeSidebarFooterProps {
  userName?: string | null
  userEmail?: string | null
  userInitial: string
  onSignOut: () => void
  onNavigate?: () => void
}

const quickLinks = [
  { href: '/settings', label: 'Genel Ayarlar', icon: 'settings' },
  { href: '/settings/widget', label: 'Sohbet Widget', icon: 'widget' },
  { href: '/settings/billing', label: 'Faturalama', icon: 'billing' },
  { href: '/settings/team', label: 'Takım', icon: 'team' },
]

export function NativeSidebarFooter({
  userName,
  userEmail,
  userInitial,
  onSignOut,
  onNavigate,
}: NativeSidebarFooterProps) {
  const { isNativeCustomerApp } = useNativeApp()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!isNativeCustomerApp) return null

  return (
    <div className="native-sidebar-footer shrink-0 border-t border-[var(--sidebar-border)] p-3 space-y-3">
      <div className="flex items-center gap-2.5 px-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600">
          {userInitial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate">{userName || 'Kullanıcı'}</p>
          <p className="text-[10px] truncate text-[var(--sidebar-foreground)]">{userEmail}</p>
        </div>
      </div>

      <div className="space-y-0.5">
        <p className="app-sidebar-group-label px-2">Hızlı Erişim</p>
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="app-sidebar-link text-[13px] py-2"
          >
            <span className="flex-1">{item.label}</span>
          </Link>
        ))}
      </div>

      {mounted && (
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium text-white/70 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
        >
          {theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
        </button>
      )}

      <button
        type="button"
        onClick={onSignOut}
        className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-[13px] font-semibold text-white bg-red-500/90 hover:bg-red-500 active:scale-[0.98] transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Çıkış Yap
      </button>
    </div>
  )
}
