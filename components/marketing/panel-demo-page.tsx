'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { PanelTourShowcase } from '@/components/marketing/panel-tour-showcase'
import { SpotlightCard } from '@/components/marketing/home-v2/fx'
import { useLocale } from '@/components/marketing/locale-provider'

export function PanelDemoPage() {
  const { locale } = useLocale()
  const isTr = locale !== 'en'

  return (
    <MarketingPageShell contentClassName="max-w-5xl">
      <div className="mb-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-1.5 text-[12px] text-white/65">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {isTr ? 'Canlı demo · Panel turu' : 'Live demo · Panel tour'}
        </span>
        <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.03em] sm:text-6xl">
          {isTr ? 'Tüm menüler, adım adım' : 'Every menu, step by step'}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty leading-relaxed text-white/60 sm:text-lg">
          {isTr
            ? 'Gerçek panelin animasyonlu turu. Ses yok, tüm menüler otomatik geçişle gösterilir.'
            : 'An animated tour of the real panel. No audio, all menus cycle automatically.'}
        </p>
      </div>

      <div className="rounded-2xl shadow-[0_40px_120px_-30px_rgba(124,58,237,0.55)]">
        <PanelTourShowcase />
      </div>

      <SpotlightCard className="mt-16">
        <div className="p-8 text-center sm:p-10">
          <ul className="mb-7 flex flex-wrap justify-center gap-3 text-xs font-medium">
            {(isTr
              ? ['14 gün PRO ücretsiz', 'Kredi kartı gerekmez', 'Kurulum 30 saniye']
              : ['14-day PRO trial', 'No credit card', '30-second setup']
            ).map((p) => (
              <li key={p} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-white/75">
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                {p}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="hv2-btn hv2-btn-glow inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-[#07060d] transition hover:bg-white/90"
          >
            {isTr ? 'Ücretsiz hesap aç' : 'Create free account'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </SpotlightCard>
    </MarketingPageShell>
  )
}
