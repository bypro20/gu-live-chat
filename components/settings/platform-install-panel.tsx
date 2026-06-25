'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronUp, Copy, Search, Store } from 'lucide-react'
import {
  PLATFORM_CATEGORY_LABELS,
  PLATFORM_INSTALL_GUIDES,
  getPlatformSnippet,
  searchPlatforms,
  type PlatformCategory,
  type PlatformInstallGuide,
} from '@/lib/platform-install-guides'
import { cn } from '@/lib/utils'

type PlatformInstallPanelProps = {
  websiteId: string
  locale?: 'tr' | 'en'
  compact?: boolean
}

const CATEGORY_ORDER: PlatformCategory[] = ['ecommerce', 'cms', 'builder', 'framework']

export function PlatformInstallPanel({
  websiteId,
  locale = 'tr',
  compact = false,
}: PlatformInstallPanelProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<PlatformCategory | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(
    compact ? null : 'shopify'
  )
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const snippet = useMemo(() => getPlatformSnippet(websiteId), [websiteId])

  const platforms = useMemo(() => {
    let list = searchPlatforms(query)
    if (category !== 'all') list = list.filter((p) => p.category === category)
    return list
  }, [query, category])

  const copySnippet = (platformId: string) => {
    void navigator.clipboard.writeText(snippet).then(() => {
      setCopiedId(platformId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const labels = {
    title: locale === 'en' ? 'Platform installation guides' : 'Platform kurulum rehberleri',
    subtitle:
      locale === 'en'
        ? `${PLATFORM_INSTALL_GUIDES.length} e-commerce and website platforms — pick yours and follow the steps.`
        : `${PLATFORM_INSTALL_GUIDES.length} e-ticaret ve site platformu — platformunuzu seçin, adımları izleyin.`,
    search: locale === 'en' ? 'Search platform…' : 'Platform ara…',
    all: locale === 'en' ? 'All' : 'Tümü',
    steps: locale === 'en' ? 'Steps' : 'Adımlar',
    placement: locale === 'en' ? 'Where to paste' : 'Yapıştırma yeri',
    copyCode: locale === 'en' ? 'Copy widget code' : 'Widget kodunu kopyala',
    copied: locale === 'en' ? 'Copied' : 'Kopyalandı',
    universalCode:
      locale === 'en'
        ? 'The same widget code works on every platform below.'
        : 'Aşağıdaki tüm platformlarda aynı widget kodu kullanılır.',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Store className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{labels.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
          <p className="text-xs text-muted-foreground mt-1">{labels.universalCode}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.search}
            className="w-full pl-9 pr-3 h-10 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={category === 'all'} onClick={() => setCategory('all')} label={labels.all} />
          {CATEGORY_ORDER.map((cat) => (
            <FilterChip
              key={cat}
              active={category === cat}
              onClick={() => setCategory(cat)}
              label={PLATFORM_CATEGORY_LABELS[cat][locale]}
            />
          ))}
        </div>
      </div>

      <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2')}>
        {platforms.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            locale={locale}
            expanded={expandedId === platform.id}
            onToggle={() => setExpandedId((id) => (id === platform.id ? null : platform.id))}
            onCopy={() => copySnippet(platform.id)}
            copied={copiedId === platform.id}
            labels={labels}
          />
        ))}
      </div>

      {platforms.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {locale === 'en' ? 'No platform matched your search.' : 'Aramanızla eşleşen platform bulunamadı.'}
        </p>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
      )}
    >
      {label}
    </button>
  )
}

function PlatformCard({
  platform,
  locale,
  expanded,
  onToggle,
  onCopy,
  copied,
  labels,
}: {
  platform: PlatformInstallGuide
  locale: 'tr' | 'en'
  expanded: boolean
  onToggle: () => void
  onCopy: () => void
  copied: boolean
  labels: {
    steps: string
    placement: string
    copyCode: string
    copied: string
  }
}) {
  const desc = locale === 'en' ? platform.desc.en : platform.desc.tr
  const steps = locale === 'en' ? platform.steps.en : platform.steps.tr
  const placement = locale === 'en' ? platform.placement.en : platform.placement.tr

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-muted/40 transition-colors"
      >
        <span
          className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: platform.accent }}
        >
          {platform.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{platform.name}</span>
            {platform.featured && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {locale === 'en' ? 'Popular' : 'Popüler'}
              </span>
            )}
            {platform.region === 'tr' && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                TR
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{desc}</p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-0 border-t border-border space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {labels.placement}
            </p>
            <p className="text-xs text-foreground bg-muted/40 rounded-lg px-2.5 py-2 font-mono">{placement}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {labels.steps}
            </p>
            <ol className="space-y-1.5">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-foreground leading-relaxed">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? labels.copied : labels.copyCode}
          </button>
        </div>
      )}
    </div>
  )
}

export function PlatformInstallBadges({ locale = 'tr' }: { locale?: 'tr' | 'en' }) {
  const featured = PLATFORM_INSTALL_GUIDES.filter((p) => p.featured).slice(0, 8)
  return (
    <div className="flex flex-wrap gap-1.5">
      {featured.map((p) => (
        <span
          key={p.id}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border border-border bg-muted/30 text-foreground"
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.accent }} />
          {p.name}
        </span>
      ))}
      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium text-muted-foreground">
        +{PLATFORM_INSTALL_GUIDES.length - featured.length}{' '}
        {locale === 'en' ? 'more' : 'daha'}
      </span>
    </div>
  )
}
