'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Logo } from '@/components/marketing/logo'

const navLinks = [
  { label: 'Özellikler', href: '/features' },
  { label: 'Yapay Zeka', href: '/ai' },
  { label: 'Apps', href: '/apps' },
  { label: 'Fiyatlandırma', href: '/pricing' },
  { label: 'Entegrasyonlar', href: '/integrations' },
  { label: 'Yardım', href: '/help' },
]

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-200 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo boyut="default" linkOlsun animasyonlu={false} />

          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
              Giriş Yap
            </Link>
            <Link href="/register" className="btn-primary">
              Ücretsiz Başla <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            aria-label="Menü"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
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
          <div className="border-t border-border mt-3 pt-3 space-y-2">
            <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-muted-foreground">
              Giriş Yap
            </Link>
            <Link href="/register" onClick={() => setMobileOpen(false)} className="block btn-primary text-center">
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
