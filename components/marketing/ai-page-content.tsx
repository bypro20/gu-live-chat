'use client'

import Link from 'next/link'
import { ArrowRight, Bot, Sparkles, BookOpen, Workflow, MessageCircle, Check } from 'lucide-react'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'
import { useT } from '@/components/marketing/locale-provider'

const CAP_ICONS = [MessageCircle, BookOpen, Workflow, Sparkles] as const

export function AiPageContent() {
  const { ai } = useMarketingPages()
  const t = useT()

  return (
    <>
      <div className="mb-12">
        <p className="section-label mb-4">{ai.badge}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{ai.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">{ai.subtitle}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-12">
        {ai.capabilities.map((c, i) => {
          const Icon = CAP_ICONS[i] ?? Sparkles
          return (
            <div key={c.title} className="surface p-5">
              <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="font-semibold mb-2">{c.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
            </div>
          )
        })}
      </div>

      <div className="surface p-8 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{ai.howTitle}</h2>
            <p className="text-sm text-muted-foreground">{ai.howSubtitle}</p>
          </div>
        </div>
        <ol className="space-y-3">
          {ai.steps.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
              <span className="text-muted-foreground pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        {ai.stats.map((stat) => (
          <div key={stat} className="surface p-4 text-center">
            <Check className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-sm font-medium">{stat}</p>
          </div>
        ))}
      </div>

      <div className="surface p-8 text-center bg-gradient-brand-subtle">
        <h2 className="text-xl font-bold mb-2">{ai.ctaTitle}</h2>
        <p className="text-sm text-muted-foreground mb-5">{ai.ctaSubtitle}</p>
        <Link href="/register" className="btn-primary">
          {t.nav.startFree} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </>
  )
}
