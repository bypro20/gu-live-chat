'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ArrowRight, Check, Shield, Zap, Clock, Star } from 'lucide-react'
import { Logo } from '@/components/marketing/logo'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { trackViewContent } from '@/lib/marketing-events'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'
import { useT } from '@/components/marketing/locale-provider'

export function AdsLandingPage() {
  const a = useMarketingPages().ads
  const t = useT()

  useEffect(() => {
    trackViewContent({ contentName: 'google-ads-basla', path: '/basla' })
  }, [])

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Logo boyut="default" linkOlsun animasyonlu={false} />
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {a.login}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-16 animate-in-up">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-light text-primary mb-4">
            <Zap className="w-3.5 h-3.5" />
            {a.badge}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            {a.title.includes(a.titleHighlight) ? (
              <>
                {a.title.split(a.titleHighlight)[0]}
                <span className="text-primary">{a.titleHighlight}</span>
                {a.title.split(a.titleHighlight)[1]}
              </>
            ) : (
              a.title
            )}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">{a.subtitle}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {a.proofs.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-muted text-foreground">
              <Check className="w-3.5 h-3.5 text-success" />
              {p}
            </span>
          ))}
        </div>

        <div className="surface p-6 sm:p-8 mb-8">
          <ul className="space-y-3 mb-8">
            {a.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>

          <Link
            href="/register?utm_source=google&utm_medium=cpc&utm_campaign=basla-landing"
            className="btn-primary w-full justify-center py-4 text-base font-bold"
          >
            {a.cta} <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-center text-xs text-muted-foreground mt-3">{t.hero.trial}</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-10 text-center">
          <div className="surface p-4">
            <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{a.statSetup}</p>
            <p className="text-xs text-muted-foreground">{a.statSetupLabel}</p>
          </div>
          <div className="surface p-4">
            <Star className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{a.statConversion}</p>
            <p className="text-xs text-muted-foreground">{a.statConversionLabel}</p>
          </div>
          <div className="surface p-4">
            <Shield className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{a.statCompliance}</p>
            <p className="text-xs text-muted-foreground">{a.statComplianceLabel}</p>
          </div>
        </div>

        <p className="text-[10px] text-center text-muted-foreground mb-6">{a.disclaimer}</p>

        <div className="flex flex-col items-center gap-4 pb-8">
          <PaymentLogos variant="footer" />
          <p className="text-xs text-muted-foreground">{a.copyright}</p>
        </div>
      </main>
    </div>
  )
}
