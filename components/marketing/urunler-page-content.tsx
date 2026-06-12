'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Check, ArrowRight, ShoppingCart, Package, Puzzle } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { IyzicoLegalBar } from '@/components/marketing/iyzico-legal-bar'
import { FadeIn } from '@/components/marketing/fade-in'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'
import { useLocale } from '@/components/marketing/locale-provider'
import { useRegionalPricing } from '@/lib/hooks/use-regional-pricing'
import { getPlanEntry } from '@/lib/plan-i18n'
import {
  ADDON_PRODUCTS,
  subscriptionBuyHref,
  addonBuyHref,
} from '@/lib/product-catalog'
import type { PlanId } from '@/lib/plan-cta'

const PLAN_IDS: PlanId[] = ['FREE', 'STARTER', 'PRO', 'BUSINESS']
const HIGHLIGHTED: PlanId = 'PRO'

const DETAIL_HREFS: Record<PlanId, string> = {
  FREE: '/canli-destek',
  STARTER: '/canli-destek',
  PRO: '/chatbot',
  BUSINESS: '/contact?konu=kurumsal',
}

export function UrunlerPageContent() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const { urunler: u, common, apps } = useMarketingPages()
  const { locale } = useLocale()
  const { planPrice } = useRegionalPricing()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />

      <section className="pt-28 pb-16 px-4 sm:px-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-6xl mx-auto text-center">
          <FadeIn>
            <span className="section-label mb-4">{u.heroBadge}</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mt-4">{u.heroTitle}</h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{u.heroSubtitle}</p>
          </FadeIn>
          <FadeIn delay={0.08}>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="#paketler" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors">
                <Package className="w-4 h-4" />
                {u.packagesBtn}
              </a>
              <a href="#eklentiler" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-colors border border-border">
                <Puzzle className="w-4 h-4" />
                {u.addonsBtn}
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="paketler" className="py-16 px-4 sm:px-6 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">{u.packagesTitle}</h2>
                <p className="mt-2 text-muted-foreground text-sm">{u.packagesSubtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>{u.monthly}</span>
                <button
                  onClick={() => setBilling((b) => (b === 'monthly' ? 'yearly' : 'monthly'))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${billing === 'yearly' ? 'bg-primary' : 'bg-border'}`}
                  aria-label={u.billingAria}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${billing === 'yearly' ? 'translate-x-6' : ''}`} />
                </button>
                <span className={`text-sm font-medium ${billing === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {u.yearly} <span className="text-[10px] font-bold text-success">{u.yearlyDiscount}</span>
                </span>
              </div>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLAN_IDS.map((planId, i) => {
              const planMeta = getPlanEntry(locale, planId)
              const regional = planPrice(planId, billing === 'yearly')
              const buyHref = subscriptionBuyHref(planId, isLoggedIn)
              const buyLabel =
                planId === 'FREE' ? u.startFree : planId === 'BUSINESS' ? u.getQuote : u.buyNow
              const highlighted = planId === HIGHLIGHTED

              return (
                <FadeIn key={planId} delay={i * 0.05} className="h-full">
                  <article className={`h-full surface p-6 flex flex-col ${highlighted ? 'border-primary ring-1 ring-primary/20' : ''}`}>
                    {highlighted && (
                      <span className="self-start mb-3 px-2.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full uppercase">
                        {common.popular}
                      </span>
                    )}
                    <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center text-xl mb-4">📦</div>
                    <h3 className="text-lg font-bold">{planMeta.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{planMeta.description}</p>
                    <div className="mt-4 mb-4">
                      <span className="text-2xl font-bold">
                        {planId === 'FREE' ? u.freeProduct : regional.formatted}
                      </span>
                      {planId !== 'FREE' && <span className="text-sm text-muted-foreground">{u.perMonth}</span>}
                    </div>
                    <Link href={buyHref} className={`inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${highlighted ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-primary-light text-primary hover:bg-primary hover:text-white'}`}>
                      <ShoppingCart className="w-4 h-4" />
                      {buyLabel}
                    </Link>
                    <Link href={DETAIL_HREFS[planId]} className="mt-2 text-center text-xs text-primary hover:underline">
                      {u.productDetails} →
                    </Link>
                    <ul className="space-y-2 mt-5 flex-1 border-t border-border pt-4">
                      {planMeta.features.slice(0, 5).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </article>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      <section id="eklentiler" className="py-16 px-4 sm:px-6 bg-muted/30 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold">{u.addonsTitle}</h2>
            <p className="mt-2 text-muted-foreground text-sm mb-10">{u.addonsSubtitle}</p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ADDON_PRODUCTS.map((addon, i) => {
              const localized = apps.items[i]
              const name = localized?.name ?? addon.name
              const desc = localized?.desc ?? addon.description
              const price = localized?.price ?? `₺${addon.monthlyPrice}/ay`

              return (
                <FadeIn key={addon.slug} delay={i * 0.04}>
                  <article className="surface p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-lg bg-primary-light flex items-center justify-center text-xl">{addon.icon}</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-light text-success">{u.active}</span>
                    </div>
                    <h3 className="font-semibold mt-1 mb-1">{name}</h3>
                    <p className="text-sm text-muted-foreground flex-1 mb-4">{desc}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="font-bold">{price}</span>
                      <Link href={addonBuyHref(isLoggedIn)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {u.buyNow}
                      </Link>
                    </div>
                  </article>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <PaymentLogos variant="footer" />
          <p className="text-sm text-muted-foreground leading-relaxed">{u.paymentNote}</p>
          <IyzicoLegalBar />
          <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            {u.comparePricing} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
