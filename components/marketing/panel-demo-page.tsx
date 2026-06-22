'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Logo } from '@/components/marketing/logo'
import { PanelTourShowcase } from '@/components/marketing/panel-tour-showcase'
import { useLocale } from '@/components/marketing/locale-provider'

export function PanelDemoPage() {
  const { locale } = useLocale()
  const isTr = locale !== 'en'

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/80 via-white to-fuchsia-50/40">
      <header className="border-b border-border/60 px-4 py-4 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo boyut="default" linkOlsun animasyonlu={false} />
          <Link href="/register" className="text-sm font-semibold text-primary hover:underline">
            {isTr ? 'Ücretsiz Başla' : 'Start Free'}
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 text-white shadow-lg mb-4">
            {isTr ? 'Canlı Demo · Panel Turu' : 'Live Demo · Panel Tour'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {isTr ? 'Tüm menüler, adım adım' : 'Every menu, step by step'}
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            {isTr
              ? 'Ana sayfadaki gibi animasyonlu panel — ses yok, tüm menüler otomatik geçişle gösterilir.'
              : 'Animated panel like the homepage — no audio, all menus cycle automatically.'}
          </p>
        </div>

        <PanelTourShowcase />

        <div className="surface p-6 sm:p-8 text-center mt-14">
          <ul className="flex flex-wrap justify-center gap-3 mb-6 text-xs font-semibold">
            {(isTr
              ? ['14 gün PRO ücretsiz', 'Kredi kartı gerekmez', 'Kurulum 30 saniye']
              : ['14-day PRO trial', 'No credit card', '30-second setup']
            ).map((p) => (
              <li key={p} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted">
                <Check className="w-3.5 h-3.5 text-success" />
                {p}
              </li>
            ))}
          </ul>
          <Link href="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold">
            {isTr ? 'Ücretsiz Hesap Aç' : 'Create Free Account'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  )
}
