'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ArrowRight, Check, Shield, Zap, Clock, Star } from 'lucide-react'
import { Logo } from '@/components/marketing/logo'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { trialHeroLine, TRIAL_DAYS } from '@/lib/trial-config'
import { trackViewContent } from '@/lib/marketing-events'

const proofs = [
  'Kredi kartı gerekmez',
  `${TRIAL_DAYS} gün PRO ücretsiz`,
  'Kurulum 30 saniye',
  'KVKK uyumlu',
]

const bullets = [
  'Canlı sohbet widget — sitenize tek satır kod',
  'AI chatbot — tekrarlayan soruları otomatik yanıtla',
  'WhatsApp & e-posta — tek gelen kutusu',
  'Ziyaretçi takibi — kim sitede, hangi sayfada',
]

export function AdsLandingPage() {
  useEffect(() => {
    trackViewContent({ contentName: 'google-ads-basla', path: '/basla' })
  }, [])

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Logo boyut="default" linkOlsun animasyonlu={false} />
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Giriş
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-light text-primary mb-4">
            <Zap className="w-3.5 h-3.5" />
            Türkiye&apos;nin canlı destek platformu
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Müşterilerinize <span className="text-primary">anında</span> ulaşın, satışları artırın
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Web sitenize 30 saniyede canlı sohbet ekleyin. AI destekli, WhatsApp entegre, ücretsiz başlayın.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {proofs.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-muted text-foreground">
              <Check className="w-3.5 h-3.5 text-success" />
              {p}
            </span>
          ))}
        </div>

        <div className="surface p-6 sm:p-8 mb-8">
          <ul className="space-y-3 mb-8">
            {bullets.map((b) => (
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
            Ücretsiz Hesap Oluştur <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-center text-xs text-muted-foreground mt-3">{trialHeroLine()}</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-10 text-center">
          <div className="surface p-4">
            <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">30 sn</p>
            <p className="text-xs text-muted-foreground">Kurulum süresi</p>
          </div>
          <div className="surface p-4">
            <Star className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">%40</p>
            <p className="text-xs text-muted-foreground">Dönüşüm artışı*</p>
          </div>
          <div className="surface p-4">
            <Shield className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">KVKK</p>
            <p className="text-xs text-muted-foreground">Uyumlu altyapı</p>
          </div>
        </div>

        <p className="text-[10px] text-center text-muted-foreground mb-6">
          *Canlı destek kullanan işletmelerde ortalama dönüşüm iyileşmesi — sektöre göre değişir.
        </p>

        <div className="flex flex-col items-center gap-4 pb-8">
          <PaymentLogos variant="footer" />
          <p className="text-xs text-muted-foreground">Gu Chat © 2026 · guchat.org</p>
        </div>
      </main>
    </div>
  )
}
