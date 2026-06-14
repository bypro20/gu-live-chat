'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { getMarketingPlanCta, type PlanId } from '@/lib/plan-cta'
import { TRIAL_DAYS } from '@/lib/trial-config'
import { type PlanType } from '@/lib/constants'
import { buildPlanCardFeatures } from '@/lib/plan-i18n'
import {
  getPricingFaqs,
  getPricingFeatureGroups,
  getPricingPageUi,
  PRICING_PLAN_META,
} from '@/lib/pricing-page-i18n'
import { getPlanCatalog } from '@/lib/plan-i18n'
import { Check, Minus, X, ArrowRight, Sparkles, HelpCircle } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { PaymentFlowStrip } from '@/components/marketing/feature-micro-showcases'
import { FadeIn } from '@/components/marketing/fade-in'
import { useLocale } from '@/components/marketing/locale-provider'
import { useRegionalPricing } from '@/lib/hooks/use-regional-pricing'
import type { SiteLocale } from '@/lib/regional-config'

interface PlanCardFeature {
  label: string
  included: boolean
}

function PlanFeatureList({ planId, locale }: { planId: PlanType; locale: SiteLocale }) {
  const features = buildPlanCardFeatures(planId, locale)
  return (
    <ul className="mt-5 mb-5 flex-1 space-y-2 border-t border-slate-100 pt-5">
      {features.map((f) => (
        <li
          key={f.label}
          className={`flex items-start gap-2 text-xs leading-relaxed ${f.included ? 'text-slate-700' : 'text-slate-400'}`}
        >
          {f.included ? (
            <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
          ) : (
            <X className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
          )}
          <span className={f.included ? '' : 'line-through decoration-slate-300/60'}>{f.label}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

type FeatureValue = boolean | string | null

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <span className="flex items-center justify-center">
        <Check className="w-4 h-4 text-emerald-500" />
      </span>
    )
  }
  if (value === false || value === null) {
    return (
      <span className="flex items-center justify-center">
        <Minus className="w-4 h-4 text-slate-200" />
      </span>
    )
  }
  return <span className="text-sm font-medium text-slate-700 text-center block">{value}</span>
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
      >
        {q}
        <span className={`ml-4 flex-shrink-0 w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center transition-transform ${open ? 'rotate-45' : ''}`}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
          {a}
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const { locale } = useLocale()
  const { planPrice } = useRegionalPricing()
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const ui = getPricingPageUi(locale)
  const catalog = getPlanCatalog(locale)
  const faqs = getPricingFaqs(locale)

  const tablePrices = useMemo(
    () => ({
      free: planPrice('FREE').formatted,
      starter: planPrice('STARTER').formatted,
      pro: planPrice('PRO').formatted,
      business: planPrice('BUSINESS').formatted,
    }),
    [planPrice]
  )

  const featureGroups = useMemo(
    () => getPricingFeatureGroups(locale, tablePrices),
    [locale, tablePrices]
  )

  const planCta = (planId: PlanId) => getMarketingPlanCta(planId, { isLoggedIn, locale })

  const trialBadge =
    locale === 'en'
      ? `Try any plan free for ${TRIAL_DAYS} days`
      : `Her planı ${TRIAL_DAYS} gün boyunca ücretsiz deneyin`

  return (
    <>
      <MarketingNav />
      <main className="min-h-screen bg-white">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="pt-32 pb-16 px-4 sm:px-6 text-center bg-gradient-to-b from-slate-50 to-white">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 mb-6">
              <Sparkles className="w-3 h-3" />
              {trialBadge}
            </span>
          </FadeIn>
          <FadeIn delay={0.05}>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              {ui.heroTitle}
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              {ui.heroSubtitle}
            </p>
          </FadeIn>

          {/* Billing toggle */}
          <FadeIn delay={0.15}>
            <div className="flex items-center justify-center gap-4 mt-10">
              <span className={`text-sm font-medium transition-colors ${billing === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>
                {ui.monthly}
              </span>
              <button
                onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative w-12 h-6 rounded-full transition-colors ${billing === 'yearly' ? 'bg-blue-600' : 'bg-slate-200'}`}
                aria-label={ui.monthly}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${billing === 'yearly' ? 'translate-x-6' : ''}`} />
              </button>
              <span className={`text-sm font-medium transition-colors ${billing === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>
                {ui.yearly}
                <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                  {ui.yearlyDiscount}
                </span>
              </span>
            </div>
          </FadeIn>
        </section>

        {/* ── Plan cards ───────────────────────────────────────────────────── */}
        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {PRICING_PLAN_META.map((plan, i) => {
              const entry = catalog[plan.id]
              const yearly = billing === 'yearly'
              const priceInfo = planPrice(plan.id, yearly)
              const badgeLabel = plan.badge === 'bestValue' ? ui.bestValue : null
              return (
                <FadeIn key={plan.id} delay={i * 0.06}>
                  <div className={`relative h-full rounded-2xl border p-6 flex flex-col transition-all ${
                    plan.highlighted
                      ? 'border-blue-500 ring-1 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    {badgeLabel && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                          {badgeLabel}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{entry.name}</h3>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{entry.description}</p>
                    </div>
                    <div className="mt-6 mb-5">
                      {priceInfo.amount === 0 ? (
                        <div>
                          <span className="text-3xl font-bold text-slate-900">{ui.free}</span>
                          <p className="text-xs text-slate-400 mt-1">{ui.forever}</p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-slate-900">{priceInfo.formatted}</span>
                            <span className="text-sm text-slate-400">{ui.perMonth}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {yearly
                              ? ui.yearlyNote(
                                  new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
                                    style: 'currency',
                                    currency: priceInfo.currency,
                                    maximumFractionDigits: priceInfo.currency === 'TRY' ? 0 : 2,
                                  }).format(priceInfo.amount * 12)
                                )
                              : ui.perWorkspace}
                          </p>
                        </div>
                      )}
                    </div>
                    <PlanFeatureList planId={plan.id as PlanType} locale={locale} />
                    <Link
                      href={planCta(plan.id as PlanId).href}
                      className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition-all ${
                        plan.highlighted
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {planCta(plan.id as PlanId).label}
                    </Link>
                    {priceInfo.amount > 0 && (
                      <p className="text-[10px] text-slate-400 text-center mt-2">
                        {ui.noCard}
                      </p>
                    )}
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </section>

        <PaymentFlowStrip />

        {/* ── Flat pricing callout ─────────────────────────────────────────── */}
        <FadeIn>
          <section className="py-10 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto bg-slate-50 rounded-2xl border border-slate-200 p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{ui.flatTitle}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  {ui.flatDesc}
                </p>
              </div>
              <Link href="/register" className="flex-shrink-0 inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-blue-700 transition-colors">
                {ui.startFree} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        </FadeIn>

        {/* ── Feature comparison table ─────────────────────────────────────── */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <FadeIn>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-2">{ui.compareTitle}</h2>
              <p className="text-slate-500 text-center text-sm mb-10">{ui.compareSubtitle}</p>
            </FadeIn>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-4 font-semibold text-slate-600 w-[40%]">{ui.featureCol}</th>
                    {PRICING_PLAN_META.map((plan) => (
                      <th key={plan.id} className={`text-center px-4 py-4 font-bold ${plan.highlighted ? 'text-blue-600' : 'text-slate-700'}`}>
                        <div>{catalog[plan.id].name}</div>
                        <div className={`text-xs font-normal mt-0.5 ${plan.highlighted ? 'text-blue-400' : 'text-slate-400'}`}>
                          {plan.id === 'FREE'
                            ? tablePrices.free
                            : `${tablePrices[plan.id === 'STARTER' ? 'starter' : plan.id === 'PRO' ? 'pro' : 'business']}${ui.perMonth}`}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureGroups.map((group) => (
                    <>
                      <tr key={group.group} className="bg-slate-50/60">
                        <td colSpan={5} className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {group.group}
                        </td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={row.label} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 text-slate-700 font-medium flex items-center gap-1.5">
                            {row.label}
                            {row.tooltip && (
                              <span title={row.tooltip}>
                                <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-help" />
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center"><FeatureCell value={row.free} /></td>
                          <td className="px-4 py-3.5 text-center"><FeatureCell value={row.starter} /></td>
                          <td className={`px-4 py-3.5 text-center ${PRICING_PLAN_META[2].highlighted ? 'bg-blue-50/40' : ''}`}>
                            <FeatureCell value={row.pro} />
                          </td>
                          <td className="px-4 py-3.5 text-center"><FeatureCell value={row.business} /></td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td className="px-5 py-4" />
                    {PRICING_PLAN_META.map((plan) => (
                      <td key={plan.id} className="px-4 py-4 text-center">
                        <Link
                          href={planCta(plan.id).href}
                          className={`inline-block text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                            plan.highlighted
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {planCta(plan.id).label}
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        {/* ── Enterprise callout ───────────────────────────────────────────── */}
        <FadeIn>
          <section className="py-10 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-8 sm:p-10">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-1">
                  <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Kurumsal</span>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">Daha özel bir şeye mi ihtiyacınız var?</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Özel entegrasyon, white-label, kişiselleştirilmiş SLA ve ekip eğitimi için kurumsal paketimizi keşfedin.
                  </p>
                  <ul className="mt-4 space-y-1.5">
                    {['Özel onboarding programı', 'Kişiselleştirilmiş SLA', 'Özel özellik geliştirme', 'Benzersiz fiyatlandırma', 'Ekip eğitimi & danışmanlık'].map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-violet-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/contact"
                  className="flex-shrink-0 inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-violet-700 transition-colors"
                >
                  İletişime Geç <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section className="py-16 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-2xl mx-auto">
            <FadeIn>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">{ui.faqTitle}</h2>
            </FadeIn>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <FadeIn key={i} delay={i * 0.04}>
                  <FaqItem
                    q={faq.q}
                    a={faq.a}
                    open={openFaq === i}
                    onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                  />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────────── */}
        <FadeIn>
          <section className="py-20 px-4 sm:px-6 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                {locale === 'en' ? 'Ready to improve customer experience?' : 'Müşteri deneyiminizi geliştirmeye hazır mısınız?'}
              </h2>
              <p className="text-slate-500 mb-8">
                {locale === 'en'
                  ? `Try free for ${TRIAL_DAYS} days. No commitment, no credit card required.`
                  : `${TRIAL_DAYS} gün ücretsiz deneyin. Taahhüt yok, kredi kartı gerekmez.`}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register" className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-colors text-sm">
                  {ui.startFree} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-slate-200 transition-colors text-sm">
                  {locale === 'en' ? 'Contact Us' : 'İletişime Geç'}
                </Link>
              </div>
            </div>
          </section>
        </FadeIn>

        <section className="py-12 px-4 border-t border-slate-200 bg-slate-50">
          <div className="max-w-xl mx-auto">
            <PaymentLogos variant="checkout" />
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  )
}
