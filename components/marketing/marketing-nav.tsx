'use client'

import Link from 'next/link'
import { ArrowRight, Download, Menu, X } from 'lucide-react'
import { Logo } from '@/components/marketing/logo'
import { MobileAndroidNavButton } from '@/components/marketing/mobile-android-bar'
import { LanguageSwitcher } from '@/components/marketing/language-switcher'
import { useT } from '@/components/marketing/locale-provider'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'
import { useEffect, useState } from 'react'

export function MarketingNav() {
  const t = useT()
  const { common } = useMarketingPages()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const navLinks = [
    { label: t.nav.products, href: '/urunler' },
    { label: t.nav.features, href: '/features' },
    { label: t.nav.pricing, href: '/pricing' },
    { label: t.nav.blog, href: '/blog' },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled ? 'glass-nav glass-nav-scrolled' : 'bg-background/95 border-border'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo boyut="default" linkOlsun animasyonlu={false} />

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition-colors duration-150"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher compact />
            <Link
              href="/mobil-indir"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="w-4 h-4 shrink-0" />
              {t.nav.mobile}
            </Link>
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
              {t.nav.login}
            </Link>
            <Link href="/register" className="btn-primary shadow-brand">
              {t.nav.startFree} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <LanguageSwitcher compact />
            <button
              type="button"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={common.menuAria}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background px-4 py-4 space-y-1 animate-in">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/mobil-indir" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-muted-foreground">
            {t.nav.mobile}
          </Link>
          <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm font-medium">
            {t.nav.login}
          </Link>
          <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center mt-2">
            {t.nav.startFree}
          </Link>
        </div>
      )}
    </nav>
  )
}
