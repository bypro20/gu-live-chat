'use client'

import type { PlanId } from '@/lib/plan-cta'
import { Check } from 'lucide-react'

const TIER_STYLES: Record<
  PlanId,
  { accent: string; ring: string; badge: string }
> = {
  FREE: {
    accent: 'bg-gradient-to-r from-slate-400 to-slate-300',
    ring: 'border-border hover:border-border-strong',
    badge: 'bg-muted text-muted-foreground',
  },
  STARTER: {
    accent: 'bg-gradient-to-r from-sky-500 to-blue-500',
    ring: 'border-border hover:border-sky-200 dark:hover:border-sky-800',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  },
  PRO: {
    accent: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    ring: 'border-primary ring-1 ring-primary/20 shadow-brand',
    badge: 'bg-primary text-primary-foreground',
  },
  BUSINESS: {
    accent: 'bg-gradient-to-r from-slate-700 to-slate-900',
    ring: 'border-border hover:border-slate-400 dark:hover:border-slate-600',
    badge: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900',
  },
}

export type PlanPricingCardProps = {
  tier: PlanId
  name: string
  description: string
  price: React.ReactNode
  priceNote?: React.ReactNode
  features: string[]
  highlighted?: boolean
  badge?: string | null
  current?: boolean
  currentLabel?: string
  cta: React.ReactNode
  footer?: React.ReactNode
  maxFeatures?: number
  className?: string
}

export function PlanPricingCard({
  tier,
  name,
  description,
  price,
  priceNote,
  features,
  highlighted,
  badge,
  current,
  currentLabel = 'Mevcut',
  cta,
  footer,
  maxFeatures,
  className = '',
}: PlanPricingCardProps) {
  const styles = TIER_STYLES[tier]
  const shown = maxFeatures ? features.slice(0, maxFeatures) : features

  return (
    <article
      className={`relative h-full flex flex-col rounded-2xl border bg-card overflow-hidden transition-shadow hover:shadow-md ${styles.ring} ${className}`}
    >
      <div className={`h-1 w-full ${styles.accent}`} aria-hidden />

      <div className="p-6 flex flex-col flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-3 min-h-[1.25rem]">
          {current && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/15 text-primary">
              {currentLabel}
            </span>
          )}
          {(badge || highlighted) && !current && (
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${styles.badge}`}>
              {badge ?? 'Popüler'}
            </span>
          )}
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ml-auto">
            {tier}
          </span>
        </div>

        <h3 className="text-lg font-bold tracking-tight text-foreground">{name}</h3>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{description}</p>

        <div className="mt-5 mb-1">{price}</div>
        {priceNote ? (
          <div className="text-xs text-muted-foreground mb-5">{priceNote}</div>
        ) : (
          <div className="mb-5" />
        )}

        <ul className="space-y-2.5 flex-1">
          {shown.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2.5} />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-4 border-t border-border">
          {cta}
          {footer && <div className="mt-2">{footer}</div>}
        </div>
      </div>
    </article>
  )
}
