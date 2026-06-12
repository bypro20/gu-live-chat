'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { getMarketingPlanCta } from '@/lib/plan-cta'
import {
  ArrowRight, Bot, BookOpen, BarChart3, MessageCircle, Users,
  Workflow, Mail, Smartphone, MessageSquare, Sparkles, Inbox, Zap,
  Check, Star, Plus, Minus, Headphones, TrendingUp, Megaphone, Languages, Globe, Download,
} from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { HeroPreview } from '@/components/marketing/hero-preview'
import { trialHeroLine } from '@/lib/trial-config'
import { useT, useLocale } from '@/components/marketing/locale-provider'
import { useRegionalPricing } from '@/lib/hooks/use-regional-pricing'
import { getPlanEntry } from '@/lib/plan-i18n'
import { APK_DOWNLOAD_FILENAME, APK_DOWNLOAD_PATH } from '@/lib/site-config'

const FEATURE_ICONS = [MessageCircle, Bot, Inbox, Languages, Users, BookOpen, BarChart3] as const
const CHANNEL_ICONS = [MessageCircle, Mail, Smartphone, MessageSquare, MessageCircle, MessageCircle] as const
const PRODUCT_ICONS = [MessageCircle, Users, Bot, BarChart3] as const
const USE_CASE_ICONS = { support: Headphones, sales: TrendingUp, marketing: Megaphone } as const
const FLOW_ICONS = [Zap, Bot, Workflow] as const

const plans = [
  { id: 'FREE' as const, monthly: 0, highlighted: false },
  { id: 'STARTER' as const, monthly: 1790, highlighted: false },
  { id: 'PRO' as const, monthly: 3790, highlighted: true },
  { id: 'BUSINESS' as const, monthly: 11990, highlighted: false },
]

function PricingCard({ plan, billing, discount, idx, isLoggedIn }: {
  plan: typeof plans[0]; billing: 'monthly' | 'yearly'; discount: number; idx: number; isLoggedIn: boolean
}) {
  const t = useT()
  const { locale } = useLocale()
  const { planPrice } = useRegionalPricing()
  const planMeta = t.plans[plan.id]
  const features = getPlanEntry(locale, plan.id).features
  const regional = planPrice(plan.id, billing === 'yearly')
  const cta = getMarketingPlanCta(plan.id, { isLoggedIn, locale })

  return (
    <FadeIn delay={idx * 0.06} className="h-full">
      <div className={`h-full surface p-6 flex flex-col ${plan.highlighted ? 'border-primary ring-1 ring-primary/20' : ''}`}>
        {plan.highlighted && (
          <span className="self-start mb-3 px-2.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full uppercase tracking-wide">{t.pricing.popular}</span>
        )}
        <h3 className="text-lg font-bold">{planMeta.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">{planMeta.desc}</p>
        <div className="mt-5 mb-6">
          {plan.monthly === 0 ? (
            <span className="text-3xl font-bold">{t.pricing.free}</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{regional.formatted}</span>
              <span className="text-sm text-muted-foreground">{t.pricing.perMonth}</span>
            </div>
          )}
        </div>
        <Link href={cta.href}
          className={`text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${
            plan.highlighted ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
          }`}>
          {cta.label}
        </Link>
        <ul className="space-y-2.5 mt-6 flex-1">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />{f}
            </li>
          ))}
        </ul>
      </div>
    </FadeIn>
  )
}

export function HomeHero() {
  const t = useT()
  const { locale } = useLocale()
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[720px] h-[320px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <FadeIn>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 bg-primary-light text-primary border border-primary/10">
              <Sparkles className="w-3.5 h-3.5" />
              {t.hero.badge}
            </span>
          </FadeIn>
          <FadeIn delay={0.06}>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight leading-[1.08] text-foreground">
              {locale === 'tr' ? (
                <>Ziyaretçinizi müşteriye dönüştürmenin <span className="text-gradient-brand">en etkili yolu</span></>
              ) : (
                <>Turn visitors into customers — <span className="text-gradient-brand">faster</span></>
              )}
            </h1>
          </FadeIn>
          <FadeIn delay={0.12}>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t.hero.subtitle}
            </p>
          </FadeIn>
          <FadeIn delay={0.18}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-lg mx-auto">
              <Link href="/register" className="btn-primary px-8 py-4 text-base w-full sm:w-auto shadow-brand-lg hover:scale-[1.02] transition-transform">
                {t.hero.cta} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/basla" className="btn-secondary px-8 py-4 text-base w-full sm:w-auto">
                {t.hero.demo}
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              {locale === 'tr' ? trialHeroLine() : t.hero.trial}
            </p>
          </FadeIn>
        </div>
        <FadeIn delay={0.22} className="mt-16 sm:mt-20">
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute -inset-4 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl blur-2xl pointer-events-none" />
            <HeroPreview />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

export function TrustStrip() {
  const h = useT().home
  return (
    <section className="py-12 border-y border-border bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-8">
          {h.trustStrip.title}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {h.trustStrip.stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function MobileAppSection() {
  const h = useT().home.mobileApp
  return (
    <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 px-6 py-10 sm:px-10 sm:py-14">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-green-400/10 blur-3xl pointer-events-none" />

            <div className="relative grid lg:grid-cols-[1fr_auto] gap-10 items-center">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/20 mb-5">
                  <Smartphone className="w-3.5 h-3.5" />
                  {h.badge}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
                  {h.title}
                </h2>
                <p className="mt-4 text-base sm:text-lg text-emerald-100/80 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  {h.desc}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center lg:items-start justify-center lg:justify-start gap-3">
                  <a
                    href={APK_DOWNLOAD_PATH}
                    download={APK_DOWNLOAD_FILENAME}
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-emerald-950 bg-white hover:bg-emerald-50 shadow-xl shadow-black/20 transition-colors w-full sm:w-auto"
                  >
                    <Download className="w-5 h-5" />
                    {h.download}
                  </a>
                  <Link
                    href="/mobil-indir"
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold text-white/90 border border-white/20 hover:bg-white/10 transition-colors w-full sm:w-auto"
                  >
                    {h.setup} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <p className="mt-4 text-xs text-emerald-200/60">{h.note}</p>
              </div>

              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  <div className="absolute inset-0 rounded-[2rem] bg-emerald-400/20 blur-2xl scale-110" />
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-[2rem] overflow-hidden ring-2 ring-white/20 shadow-2xl shadow-black/40">
                    <Image
                      src="/app-icon.png"
                      alt={h.iconAlt}
                      width={176}
                      height={176}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </section>
  )
}

export function FeatureGrid() {
  const h = useT().home.features
  return (
    <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="section-label mb-4">{h.label}</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">{h.title}</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">{h.subtitle}</p>
          </div>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {h.items.map((f, i) => {
            const Icon = FEATURE_ICONS[i] ?? MessageCircle
            return (
            <FadeIn key={f.title} delay={i * 0.04}>
              <div className="surface-hover p-5 h-full">
                <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
            )
          })}
        </div>
        <div className="text-center mt-10">
          <Link href="/features" className="text-sm font-medium text-primary hover:text-primary-hover inline-flex items-center gap-1">
            {h.cta} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export function AiShowcase() {
  const [activeStep, setActiveStep] = useState(0)
  const h = useT().home.ai

  return (
    <section id="ai" className="py-20 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <span className="section-label mb-4">{h.label}</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">
              {h.title}
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {h.desc}
            </p>
            <div className="mt-8 space-y-3">
              {h.steps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    activeStep === i ? 'border-primary bg-primary-light/50' : 'border-border bg-card hover:border-border-strong'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      activeStep === i ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}>{i + 1}</span>
                    <div>
                      <p className="font-semibold text-sm">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <Link href="/ai" className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-6 hover:text-primary-hover">
              {h.cta} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden aspect-video flex items-center justify-center bg-gradient-brand-subtle">
              <div className="absolute inset-0 bg-grid opacity-40" />
              <div className="relative text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-4 animate-float">
                  <Sparkles className="w-8 h-8" />
                </div>
                <p className="font-semibold text-lg">{h.steps[activeStep].title}</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">{h.steps[activeStep].desc}</p>
                <div className="mt-6 flex justify-center gap-1.5">
                  {h.steps.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all ${activeStep === i ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`} />
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

export function LiveTranslateSection() {
  const h = useT().home.translate
  return (
    <section id="translate" className="py-20 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <span className="section-label mb-4">{h.label}</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">
              {h.title}
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {h.desc}
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {h.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0" />{b}
                </li>
              ))}
            </ul>
            <Link href="/pricing" className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-6 hover:text-primary-hover">
              {h.cta} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </FadeIn>
          <FadeIn delay={0.08}>
            <div className="surface p-5 lg:p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
                <Globe className="w-4 h-4" />
                {h.demoStatus}
              </div>
              {h.demos.map((d) => (
                <div key={d.lang} className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                  <span className="text-[10px] font-medium text-muted-foreground">{d.lang}</span>
                  <p className="text-sm font-medium">{d.msg}</p>
                  <p className="text-xs text-primary/90 border-t border-border pt-2 italic">↳ {d.translated}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

export function SharedInbox() {
  const h = useT().home.inbox
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <FadeIn delay={0.05}>
            <div className="surface p-6 lg:p-8">
              <div className="flex flex-wrap gap-2 mb-6">
                {h.channels.map((label, i) => {
                  const Icon = CHANNEL_ICONS[i] ?? MessageCircle
                  return (
                  <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-primary-light text-primary border-primary/20">
                    <Icon className="w-3.5 h-3.5" />{label}
                  </span>
                  )
                })}
              </div>
              <div className="space-y-3">
                {h.samples.map((c) => (
                  <div key={c.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{c.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{c.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary-light text-primary rounded font-medium">{c.from}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{c.msg}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{c.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn>
            <span className="section-label mb-4">{h.label}</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">
              {h.title}
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {h.desc}
            </p>
            <Link href="/integrations" className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-6 hover:text-primary-hover">
              {h.cta} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

export function KnowledgeBaseSection() {
  const h = useT().home.knowledge
  return (
    <section className="py-20 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto text-center">
        <FadeIn>
          <span className="section-label mb-4">{h.label}</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">{h.title}</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            {h.desc}
          </p>
        </FadeIn>
        <FadeIn delay={0.1} className="mt-10 max-w-2xl mx-auto">
          <div className="surface p-6 text-left">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg mb-4">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{h.searchPlaceholder}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {h.articles.map((article) => (
                <div key={article.title} className="p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary-light/30 transition-colors cursor-default">
                  <p className="text-sm font-medium">{article.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{article.count}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

export function AiAutomationSection() {
  const h = useT().home.automation
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <FadeIn>
            <span className="section-label mb-4">{h.label}</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">{h.title}</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {h.desc}
            </p>
            <ul className="mt-6 space-y-2">
              {h.bullets.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Workflow className="w-4 h-4 text-primary shrink-0" />{item}
                </li>
              ))}
            </ul>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="surface p-6 space-y-4">
              {h.flows.map((flow, i) => {
                const Icon = FLOW_ICONS[i] ?? Workflow
                return (
                <div key={flow.trigger} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/60">
                  <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{flow.trigger}</p>
                    <p className="text-sm font-medium">{flow.action}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
                )
              })}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

export function ProductDeepDive() {
  const h = useT().home.products
  return (
    <section className="py-20 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-12">
            <span className="section-label mb-4">{h.label}</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">{h.title}</h2>
          </div>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {h.items.map((p, i) => {
            const Icon = PRODUCT_ICONS[i] ?? MessageCircle
            return (
            <FadeIn key={p.title} delay={i * 0.05}>
              <div className="surface-hover p-5 h-full flex flex-col group">
                <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1.5">{p.title}</h3>
                <p className="text-sm text-muted-foreground flex-1">{p.desc}</p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Link href={p.href} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors">
                    {h.buy}
                  </Link>
                </div>
              </div>
            </FadeIn>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function UseCasesTabs() {
  const h = useT().home.useCases
  const [active, setActive] = useState(h.cases[0]?.id ?? 'support')
  const current = h.cases.find((u) => u.id === active) ?? h.cases[0]

  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="section-label mb-4">{h.label}</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">{h.title}</h2>
          </div>
        </FadeIn>
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {h.cases.map((uc) => {
            const Icon = USE_CASE_ICONS[uc.id as keyof typeof USE_CASE_ICONS] ?? Headphones
            return (
            <button
              key={uc.id}
              onClick={() => setActive(uc.id)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                active === uc.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />{uc.label}
            </button>
            )
          })}
        </div>
        <FadeIn key={active}>
          <div className="surface p-8 lg:p-10 max-w-3xl mx-auto text-center">
            <h3 className="text-2xl font-bold">{current.title}</h3>
            <p className="mt-3 text-muted-foreground leading-relaxed">{current.desc}</p>
            <ul className="mt-6 flex flex-wrap justify-center gap-3">
              {current.bullets.map((b) => (
                <li key={b} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-light text-primary text-sm font-medium rounded-full">
                  <Check className="w-3.5 h-3.5" />{b}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

export function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const t = useT()

  return (
    <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="section-label mb-4">{t.nav.pricing}</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4">{t.pricing.title}</h2>
            <p className="mt-3 text-muted-foreground">{t.pricing.subtitle}</p>
          </div>
        </FadeIn>
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>{t.pricing.monthly}</span>
          <button onClick={() => setBilling((b) => b === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative w-12 h-6 rounded-full transition-colors ${billing === 'yearly' ? 'bg-primary' : 'bg-border'}`} aria-label={t.pricing.monthly}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${billing === 'yearly' ? 'translate-x-6' : ''}`} />
          </button>
          <span className={`text-sm font-medium ${billing === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
            {t.pricing.yearly} <span className="ml-1.5 text-[10px] font-bold text-success bg-success-light px-1.5 py-0.5 rounded-full">{t.pricing.yearlyDiscount}</span>
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {plans.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} billing={billing} discount={0.2} idx={i} isLoggedIn={isLoggedIn} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function TestimonialsSection() {
  const h = useT().home.testimonials
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{h.title}</h2>
          </div>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-5">
          {h.items.map((item, i) => (
            <FadeIn key={item.author} delay={i * 0.08}>
              <div className="surface p-6 h-full flex flex-col hover:border-primary/20 transition-colors duration-200">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground flex-1 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {item.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.author}</p>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const h = useT().home.faq

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-2xl mx-auto">
        <FadeIn>
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{h.title}</h2>
          </div>
        </FadeIn>
        <div className="space-y-2">
          {h.items.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.04}>
              <div className="surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-medium text-sm pr-4">{faq.q}</span>
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${openFaq === i ? 'bg-primary text-white rotate-0' : 'bg-muted text-muted-foreground'}`}>
                    {openFaq === i ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  </div>
                </button>
                <div className={`faq-answer ${openFaq === i ? 'faq-answer--open' : ''}`}>
                  <div className="faq-answer-inner">
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FooterCta() {
  const h = useT().home.footerCta
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="rounded-2xl bg-gradient-brand px-8 py-14 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{h.title}</h2>
            <p className="mt-3 text-white/80 max-w-md mx-auto">
              {h.desc}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {h.badges.map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-medium">
                  <Check className="w-3 h-3" />{b}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register" className="px-7 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors inline-flex items-center gap-2">
                {h.register} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/contact" className="px-7 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
                {h.contact}
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}