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
import {
  SUBSCRIPTION_PRODUCTS,
  ADDON_PRODUCTS,
  formatTry,
  subscriptionBuyHref,
  addonBuyHref,
} from '@/lib/product-catalog'

export default function UrunlerPage() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />

      {/* Hero / banner */}
      <section className="pt-28 pb-16 px-4 sm:px-6 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-6xl mx-auto text-center">
          <FadeIn>
            <span className="section-label mb-4">Dijital Ürün Kataloğu</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mt-4">
              Gu Chat abonelik paketleri ve eklentiler
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Gu Chat, fiziksel ürün satmayan bir <strong className="text-foreground">SaaS (yazılım hizmeti)</strong>{' '}
              platformudur. Tüm ürünler dijital abonelik olarak sunulur; ödeme{' '}
              <strong className="text-foreground">iyzico</strong> güvenli ödeme altyapısı ile alınır.
            </p>
          </FadeIn>
          <FadeIn delay={0.08}>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#paketler"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors"
              >
                <Package className="w-4 h-4" />
                Abonelik Paketleri
              </a>
              <a
                href="#eklentiler"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/80 transition-colors border border-border"
              >
                <Puzzle className="w-4 h-4" />
                Eklenti Mağazası
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Subscription products */}
      <section id="paketler" className="py-16 px-4 sm:px-6 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Canlı Destek Abonelik Paketleri</h2>
                <p className="mt-2 text-muted-foreground text-sm">
                  Aylık veya yıllık faturalandırma · KDV dahil fiyatlar · Anında dijital teslimat
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Aylık
                </span>
                <button
                  onClick={() => setBilling((b) => (b === 'monthly' ? 'yearly' : 'monthly'))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${billing === 'yearly' ? 'bg-primary' : 'bg-border'}`}
                  aria-label="Fatura dönemi"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      billing === 'yearly' ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${billing === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Yıllık <span className="text-[10px] font-bold text-success">-20%</span>
                </span>
              </div>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SUBSCRIPTION_PRODUCTS.map((product, i) => {
              const price =
                billing === 'yearly' && product.monthlyPrice > 0
                  ? product.yearlyMonthlyPrice
                  : product.monthlyPrice
              const buyHref = subscriptionBuyHref(product.id, isLoggedIn)
              const buyLabel =
                product.id === 'FREE'
                  ? 'Ücretsiz Başla'
                  : product.id === 'BUSINESS'
                    ? 'Teklif Al'
                    : 'Satın Al'

              return (
                <FadeIn key={product.id} delay={i * 0.05} className="h-full">
                  <article
                    className={`h-full surface p-6 flex flex-col ${
                      product.highlighted ? 'border-primary ring-1 ring-primary/20' : ''
                    }`}
                  >
                    {product.badge && (
                      <span className="self-start mb-3 px-2.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full uppercase">
                        {product.badge}
                      </span>
                    )}
                    <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center text-xl mb-4">
                      📦
                    </div>
                    <h3 className="text-lg font-bold">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{product.description}</p>
                    <div className="mt-4 mb-4">
                      <span className="text-2xl font-bold">{formatTry(price)}</span>
                      {product.monthlyPrice > 0 && (
                        <span className="text-sm text-muted-foreground">/ay</span>
                      )}
                    </div>
                    <Link
                      href={buyHref}
                      className={`inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                        product.highlighted
                          ? 'bg-primary text-white hover:bg-primary-hover'
                          : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {buyLabel}
                    </Link>
                    <Link
                      href={product.detailHref}
                      className="mt-2 text-center text-xs text-primary hover:underline"
                    >
                      Ürün detayları →
                    </Link>
                    <ul className="space-y-2 mt-5 flex-1 border-t border-border pt-4">
                      {product.features.map((f) => (
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

      {/* Addon products */}
      <section id="eklentiler" className="py-16 px-4 sm:px-6 bg-muted/30 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl font-bold">Eklenti Mağazası</h2>
            <p className="mt-2 text-muted-foreground text-sm mb-10">
              Aboneliğinize ek olarak etkinleştirebileceğiniz dijital eklentiler — aylık abonelik
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ADDON_PRODUCTS.map((addon, i) => (
              <FadeIn key={addon.slug} delay={i * 0.04}>
                <article className="surface p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-lg bg-primary-light flex items-center justify-center text-xl">
                      {addon.icon}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-light text-success">
                      Aktif
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {addon.category}
                  </span>
                  <h3 className="font-semibold mt-1 mb-1">{addon.name}</h3>
                  <p className="text-sm text-muted-foreground flex-1 mb-4">{addon.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="font-bold">{formatTry(addon.monthlyPrice)}/ay</span>
                    <Link
                      href={addonBuyHref(isLoggedIn)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Satın Al
                    </Link>
                  </div>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Payment & legal */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <PaymentLogos variant="footer" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ödemeler iyzico güvenli ödeme altyapısı ile 256-bit SSL üzerinden işlenir. Visa ve MasterCard
            kabul edilir. Dijital hizmetler satın alma sonrası anında hesabınıza tanımlanır.
          </p>
          <IyzicoLegalBar />
          <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            Detaylı fiyat karşılaştırması <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
