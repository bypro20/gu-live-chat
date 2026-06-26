'use client'

import Link from 'next/link'
import { ArrowRight, Download, Mail, Menu, Phone, X } from 'lucide-react'
import { Logo } from '@/components/marketing/logo'
import { LanguageSwitcher } from '@/components/marketing/language-switcher'
import { useLocale, useT } from '@/components/marketing/locale-provider'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'
import { useEffect, useState } from 'react'

export function MarketingNav() {
  const t = useT()
  const { locale } = useLocale()
  const { common } = useMarketingPages()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const lang = locale === 'en' ? 'en' : 'tr'

  const navLinks = [
    { label: t.nav.products, href: '/urunler' },
    { label: t.nav.features, href: '/features' },
    { label: t.nav.platforms, href: '/platformlar' },
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
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="hidden lg:block bg-primary text-primary-foreground text-xs border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-2">
          <span className="font-medium opacity-90">
            {lang === 'en' ? '7/24 support · KVKK compliant · Turkish infrastructure' : '7/24 destek · KVKK uyumlu · Türk altyapısı'}
          </span>
          <div className="flex items-center gap-5">
            <a href="mailto:destek@gulivechat.com" className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <Mail className="w-3.5 h-3.5" /> destek@gulivechat.com
            </a>
            <Link href="/contact" className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <Phone className="w-3.5 h-3.5" /> {lang === 'en' ? 'Contact' : 'İletişim'}
            </Link>
          </div>
        </div>
      </div>
      <nav
        className={`transition-all duration-300 border-b ${
          scrolled
            ? 'glass-nav glass-nav-scrolled bg-white/90 border-border/80'
            : 'bg-background/80 backdrop-blur-md border-transparent'
        }`}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[4.25rem]">
          <Logo boyut="default" linkOlsun animasyonlu={false} />

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors duration-150"
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
            <Link href="/register" className="btn-primary rounded-xl px-5 py-2.5 shadow-brand">
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
    </header>
  )
}
