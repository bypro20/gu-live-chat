'use client'

import Link from 'next/link'
import { Shield, Globe, Copyright, Lock } from 'lucide-react'
import { Logo } from '@/components/marketing/logo'
import { IyzicoLegalBar } from '@/components/marketing/iyzico-legal-bar'
import { SocialLinksBar } from '@/components/marketing/social-links-bar'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { useT } from '@/components/marketing/locale-provider'
import { SITE_LEGAL } from '@/lib/site-legal'

export function MarketingFooter() {
  const footer = useT().footerExtended

  return (
    <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <Logo boyut="sm" linkOlsun animasyonlu={false} className="mb-4" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
              {SITE_LEGAL.tagline}. {footer.taglineExtra}
            </p>
          </div>
          {footer.columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">{col.title}</h4>
              <div className="space-y-2.5">
                {col.links.map((link) => (
                  <Link key={link.href} href={link.href} className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border space-y-8">
          <IyzicoLegalBar />
          <SocialLinksBar />
          <div className="flex justify-center">
            <PaymentLogos variant="footer" />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Copyright className="w-3.5 h-3.5" />
              <span>Gu Live Chat © 2026</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" />{footer.badges.ssl}</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" />{footer.badges.privacy}</span>
              <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" />{footer.badges.madeIn}</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-success rounded-full" />{footer.badges.uptime}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
