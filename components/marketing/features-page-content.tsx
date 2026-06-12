'use client'

import Link from 'next/link'
import {
  ArrowRight, MessageCircle, Bot, Users, BarChart3, Workflow, Blocks, Shield, Zap,
  Sparkles, Video, Phone, Megaphone, Inbox, BookOpen, Code, Languages,
} from 'lucide-react'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'
import { useT } from '@/components/marketing/locale-provider'
import { trialShortLabel } from '@/lib/trial-config'

const ICONS = [
  Sparkles, MessageCircle, Languages, Inbox, Bot, Sparkles, Blocks, Megaphone,
  Users, Video, Phone, BookOpen, Workflow, BarChart3, Code, Shield, Zap,
] as const

export function FeaturesPageContent() {
  const { features } = useMarketingPages()
  const t = useT()

  return (
    <>
      <div className="mb-12">
        <p className="section-label mb-4">{features.badge}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{features.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">{features.subtitle}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-12">
        {features.items.map((f, i) => {
          const Icon = ICONS[i] ?? MessageCircle
          return (
            <div key={f.title} id={f.id} className="surface p-5 scroll-mt-28">
              <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="font-semibold mb-2">{f.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          )
        })}
      </div>

      <div className="surface p-8 text-center bg-gradient-brand-subtle">
        <h2 className="text-xl font-bold mb-2">
          {features.ctaTitle.replace('{trial}', trialShortLabel())}
        </h2>
        <p className="text-sm text-muted-foreground mb-5">{features.ctaNote}</p>
        <Link href="/register" className="btn-primary">
          {t.nav.startFree} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </>
  )
}
