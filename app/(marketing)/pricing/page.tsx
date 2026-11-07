'use client'

import { Fragment, useState, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { getMarketingPlanCta, type PlanId } from '@/lib/plan-cta'
import { TRIAL_DAYS } from '@/lib/trial-config'
import { type PlanType } from '@/lib/constants'
import { buildPlanCardFeatures, getPlanCatalog } from '@/lib/plan-i18n'
import {
  getPricingFaqs,
  getPricingFeatureGroups,
  getPricingPageUi,
  PRICING_PLAN_META,
} from '@/lib/pricing-page-i18n'
import { Check, Minus, X, ArrowRight, Sparkles, HelpCircle, Plus } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { Starfield, SpotlightCard } from '@/components/marketing/home-v2/fx'
import { useLocale } from '@/components/marketing/locale-provider'
import { useRegionalPricing } from '@/lib/hooks/use-regional-pricing'
import type { SiteLocale } from '@/lib/regional-config'

function PlanFeatureList({ planId, locale }: { planId: PlanType; locale: SiteLocale }) {
  const features = buildPlanCardFeatures(planId, locale)
  return (
    <ul className="mb-6 mt-6 flex-1 space-y-2.5 border-t border-white/10 pt-6">
      {features.map((f) => (
        <li
          key={f.label}
          className={`flex items-start gap-2.5 text-[13px] leading-relaxed ${f.included ? 'text-white/80' : 'text-white/30'}`}
        >
          {f.included ? (
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
          ) : (
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/20" />
          )}
          <span className={f.included ? '' : 'line-through decoration-white/20'}>{f.label}</span>
        </li>
      ))}
    </ul>
  )
}

type FeatureValue = boolean | string | null

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <span className="flex items-center justify-center">
        <Check className="h-4 w-4 text-emerald-300" />
      </span>
    )
  }
  if (value === false || value === null) {
    return (
      <span className="flex items-center justify-center">
        <Minus className="h-4 w-4 text-white/15" />
      </span>
    )
  }
  return <span className="block text-center text-sm font-medium text-white/80">{value}</span>
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-[15px] font-medium text-white transition-colors hover:bg-white/[0.04]"
      >
        {q}
        <Plus className={`ml-4 h-4 w-4 shrink-0 text-violet-300 transition-transform duration-300 ${open ? 'rotate-45' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="border-t border-white/[0.07] px-5 pb-5 pt-4 text-sm leading-relaxed text-white/60">{a}</p>
        </div>
      </div>
    </div>
  )
}

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
    [planPrice],
  )

  const featureGroups = useMemo(() => getPricingFeatureGroups(locale, tablePrices), [locale, tablePrices])
  const planCta = (planId: PlanId) => getMarketingPlanCta(planId, { isLoggedIn, locale })
  const trialBadge =
    locale === 'en' ? `Try any plan free for ${TRIAL_DAYS} days` : `Her planı ${TRIAL_DAYS} gün boyunca ücretsiz deneyin`

  return (
    <div className="dark hv2-scope hv2-grain relative min-h-screen overflow-hidden text-foreground">
      <MarketingNav tone="dark" />
      <main className="relative z-10">
        {/* Hero */}
        <section className="relative px-4 pb-10 pt-36 text-center sm:px-6">
          <div className="hv2-aurora" aria-hidden="true" />
          <Starfield count={70} />
          <div className="relative mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-1.5 text-[12px] text-white/65">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              {trialBadge}
            </span>
            <h1 className="mt-7 text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.03em] sm:text-6xl">
              {ui.heroTitle}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty leading-relaxed text-white/60 sm:text-lg">{ui.heroSubtitle}</p>

            <div className="mt-9 inline-flex items-center gap-4 rounded-full border border-white/10 bg-white/[0.04] p-1.5 pr-4">
              <div role="tablist" className="flex">
                {(['monthly', 'yearly'] as const).map((k) => (
                  <button
                    key={k}
                    role="tab"
                    aria-selected={billing === k}
                    onClick={() => setBilling(k)}
                    className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                      billing === k ? 'bg-white text-[#07060d]' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {k === 'monthly' ? ui.monthly : ui.yearly}
                  </button>
                ))}
              </div>
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                {ui.yearlyDiscount}
              </span>
            </div>
          </div>
        </section>

        {/* Plan kartları */}
        <section className="relative px-4 pb-16 pt-6 sm:px-6">
          <div className="mx-auto grid max-w-6xl items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING_PLAN_META.map((plan) => {
              const entry = catalog[plan.id]
              const yearly = billing === 'yearly'
              const priceInfo = planPrice(plan.id, yearly)
              const cta = planCta(plan.id as PlanId)
              return (
                <div key={plan.id} className={`relative ${plan.highlighted ? 'lg:-mt-3 lg:mb-3' : ''}`}>
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-violet-500 px-3.5 py-1 text-[11px] font-semibold text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.9)]">
                      {ui.bestValue}
                    </div>
                  )}
                  <SpotlightCard
                    className={`flex h-full flex-col p-7 ${
                      plan.highlighted ? '!border-violet-300/40 shadow-[0_30px_100px_-30px_rgba(124,58,237,0.7)]' : ''
                    }`}
                  >
                    <div className="flex h-full flex-col">
                      <h3 className="text-lg font-semibold tracking-tight">{entry.name}</h3>
                      <p className="mt-1.5 min-h-[40px] text-[13px] leading-relaxed text-white/50">{entry.description}</p>
                      <div className="mt-6">
                        {priceInfo.amount === 0 ? (
                          <>
                            <span className="text-4xl font-semibold tracking-tight">{ui.free}</span>
                            <p className="mt-1 text-xs text-white/40">{ui.forever}</p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-semibold tracking-tight">{priceInfo.formatted}</span>
                              <span className="text-sm text-white/45">{ui.perMonth}</span>
                            </div>
                            <p className="mt-1 text-xs text-white/40">
                              {yearly
                                ? ui.yearlyNote(
                                    new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
                                      style: 'currency',
                                      currency: priceInfo.currency,
                                      maximumFractionDigits: priceInfo.currency === 'TRY' ? 0 : 2,
                                    }).format(priceInfo.amount * 12),
                                  )
                                : ui.perWorkspace}
                            </p>
                          </>
                        )}
                      </div>
                      <PlanFeatureList planId={plan.id as PlanType} locale={locale} />
                      <Link
                        href={cta.href}
                        className={`hv2-btn inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                          plan.highlighted
                            ? 'hv2-btn-glow bg-white text-[#07060d] hover:bg-white/90'
                            : 'border border-white/15 text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        {cta.label}
                      </Link>
                      {priceInfo.amount > 0 && <p className="mt-3 text-center text-[11px] text-white/35">{ui.noCard}</p>}
                    </div>
                  </SpotlightCard>
                </div>
              )
            })}
          </div>
        </section>

        {/* Karşılaştırma */}
        <section className="relative px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{ui.compareTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/50">{ui.compareSubtitle}</p>

            <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="w-[40%] px-5 py-4 text-left font-medium text-white/50">{ui.featureCol}</th>
                    {PRICING_PLAN_META.map((plan) => (
                      <th key={plan.id} className={`px-4 py-4 text-center font-semibold ${plan.highlighted ? 'text-violet-200' : 'text-white'}`}>
                        <div>{catalog[plan.id].name}</div>
                        <div className="mt-0.5 text-xs font-normal text-white/40">
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
                    <Fragment key={group.group}>
                      <tr className="bg-white/[0.025]">
                        <td colSpan={5} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300/80">
                          {group.group}
                        </td>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={row.label} className="border-t border-white/[0.06] transition-colors hover:bg-white/[0.03]">
                          <td className="flex items-center gap-1.5 px-5 py-3.5 font-medium text-white/80">
                            {row.label}
                            {row.tooltip && (
                              <span title={row.tooltip}>
                                <HelpCircle className="h-3.5 w-3.5 cursor-help text-white/25" />
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5"><FeatureCell value={row.free} /></td>
                          <td className="px-4 py-3.5"><FeatureCell value={row.starter} /></td>
                          <td className="bg-violet-400/[0.05] px-4 py-3.5"><FeatureCell value={row.pro} /></td>
                          <td className="px-4 py-3.5"><FeatureCell value={row.business} /></td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10 bg-white/[0.03]">
                    <td className="px-5 py-4" />
                    {PRICING_PLAN_META.map((plan) => (
                      <td key={plan.id} className="px-4 py-4 text-center">
                        <Link
                          href={planCta(plan.id as PlanId).href}
                          className={`inline-block rounded-lg px-4 py-2 text-xs font-semibold transition ${
                            plan.highlighted ? 'bg-white text-[#07060d] hover:bg-white/90' : 'border border-white/15 text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          {planCta(plan.id as PlanId).label}
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        {/* Sabit fiyat vurgusu */}
        <section className="px-4 py-10 sm:px-6">
          <SpotlightCard className="mx-auto max-w-4xl">
            <div className="flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">{ui.flatTitle}</h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">{ui.flatDesc}</p>
              </div>
              <Link
                href="/register"
                className="hv2-btn hv2-btn-glow inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#07060d]"
              >
                {ui.startFree} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </SpotlightCard>
        </section>

        {/* SSS */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-10 text-center text-3xl font-semibold tracking-[-0.02em]">{ui.faqTitle}</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
              ))}
            </div>
          </div>
        </section>

        {/* Kapanış */}
        <section className="px-4 pb-20 pt-10 text-center sm:px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.025em] sm:text-5xl">{ui.footerCtaTitle}</h2>
            <p className="mx-auto mt-5 max-w-md text-white/55">{ui.footerCtaSubtitle}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="hv2-btn hv2-btn-glow inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-[#07060d]"
              >
                {ui.startFree} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-xl border border-white/15 px-8 py-4 text-sm font-medium text-white/80 transition hover:bg-white/[0.06]"
              >
                {ui.contactUs}
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.07] px-4 py-12">
          <div className="mx-auto max-w-xl rounded-xl bg-white px-5 py-4">
            <PaymentLogos variant="checkout" />
          </div>
        </section>
      </main>
      <MarketingFooter tone="dark" />
    </div>
  )
}
