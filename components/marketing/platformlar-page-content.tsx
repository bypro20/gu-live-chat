'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Check, ChevronDown, ChevronUp, Copy, Search } from 'lucide-react'
import {
  PLATFORM_CATEGORY_LABELS,
  PLATFORM_INSTALL_GUIDES,
  getPlatformSnippet,
  searchPlatforms,
  type PlatformCategory,
  type PlatformInstallGuide,
} from '@/lib/platform-install-guides'
import { useLocale, useT } from '@/components/marketing/locale-provider'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'
import { cn } from '@/lib/utils'

const CATEGORY_ORDER: PlatformCategory[] = ['ecommerce', 'cms', 'builder', 'framework']

export function PlatformlarPageContent() {
  const { locale } = useLocale()
  const lang = locale === 'en' ? 'en' : 'tr'
  const t = useT()
  const { common } = useMarketingPages()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<PlatformCategory | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>('shopify')

  const platforms = useMemo(() => {
    let list = searchPlatforms(query)
    if (category !== 'all') list = list.filter((p) => p.category === category)
    return list
  }, [query, category])

  const featured = PLATFORM_INSTALL_GUIDES.filter((p) => p.featured)

  const copy = {
    badge: lang === 'en' ? 'Platform guides' : 'Platform rehberleri',
    title:
      lang === 'en'
        ? 'Live chat for every store and website platform'
        : 'Her e-ticaret ve site platformunda canlı destek',
    subtitle:
      lang === 'en'
        ? `${PLATFORM_INSTALL_GUIDES.length} platforms — Shopify, WordPress, Wix, WooCommerce, IdeaSoft, Ticimax, ikas and more. Copy one widget snippet and follow the guide for your stack.`
        : `${PLATFORM_INSTALL_GUIDES.length} platform — Shopify, WordPress, Wix, WooCommerce, IdeaSoft, Ticimax, ikas ve daha fazlası. Tek widget kodu; platformunuza özel adımları izleyin.`,
    search: lang === 'en' ? 'Search platform…' : 'Platform ara…',
    all: lang === 'en' ? 'All' : 'Tümü',
    messagingLink:
      lang === 'en' ? 'WhatsApp, Messenger & API integrations' : 'WhatsApp, Messenger ve API entegrasyonları',
    ctaTitle: lang === 'en' ? 'Get your widget code in 30 seconds' : 'Widget kodunuzu 30 saniyede alın',
    ctaSubtitle:
      lang === 'en'
        ? 'Create a free account, open Settings → Widget, copy the snippet and paste it on your site.'
        : 'Ücretsiz hesap açın, Ayarlar → Widget bölümünden kodu kopyalayıp sitenize yapıştırın.',
  }

  return (
    <>
      <div className="mb-10 sm:mb-12">
        <p className="section-label mb-4">{copy.badge}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-3xl">{copy.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">{copy.subtitle}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {featured.slice(0, 10).map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-muted/40 text-foreground"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.accent }} />
              {p.name}
            </span>
          ))}
          <span className="inline-flex items-center px-2.5 py-1 text-xs text-muted-foreground">
            +{PLATFORM_INSTALL_GUIDES.length - 10} {lang === 'en' ? 'more' : 'daha'}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.search}
            className="w-full pl-9 pr-3 h-11 rounded-xl border border-border bg-background text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={category === 'all'} onClick={() => setCategory('all')} label={copy.all} />
          {CATEGORY_ORDER.map((cat) => (
            <FilterChip
              key={cat}
              active={category === cat}
              onClick={() => setCategory(cat)}
              label={PLATFORM_CATEGORY_LABELS[cat][lang]}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-14">
        {platforms.map((platform) => (
          <PlatformGuideCard
            key={platform.id}
            platform={platform}
            lang={lang}
            expanded={expandedId === platform.id}
            onToggle={() => setExpandedId((id) => (id === platform.id ? null : platform.id))}
          />
        ))}
      </div>

      {platforms.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12 mb-14">
          {lang === 'en' ? 'No platform matched your search.' : 'Aramanızla eşleşen platform bulunamadı.'}
        </p>
      )}

      <div className="surface p-6 sm:p-8 text-center mb-8">
        <h2 className="text-lg font-bold">{copy.ctaTitle}</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-5 max-w-md mx-auto">{copy.ctaSubtitle}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register" className="btn-primary">
            {t.nav.startFree} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/integrations"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {copy.messagingLink} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {common.active} · {PLATFORM_INSTALL_GUIDES.length}{' '}
        {lang === 'en' ? 'platforms · No extra development required' : 'platform · Ek geliştirme gerekmez'}
      </p>
    </>
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
        'px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
      )}
    >
      {label}
    </button>
  )
}

function PlatformGuideCard({
  platform,
  lang,
  expanded,
  onToggle,
}: {
  platform: PlatformInstallGuide
  lang: 'tr' | 'en'
  expanded: boolean
  onToggle: () => void
}) {
  const [copied, setCopied] = useState(false)
  const desc = lang === 'en' ? platform.desc.en : platform.desc.tr
  const steps = lang === 'en' ? platform.steps.en : platform.steps.tr
  const placement = lang === 'en' ? platform.placement.en : platform.placement.tr
  const demoSnippet = getPlatformSnippet('WEBSITE_ID')

  const copyDemo = () => {
    void navigator.clipboard.writeText(demoSnippet).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="surface overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span
          className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: platform.accent }}
        >
          {platform.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{platform.name}</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {PLATFORM_CATEGORY_LABELS[platform.category][lang]}
            </span>
            {platform.featured && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {lang === 'en' ? 'Popular' : 'Popüler'}
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
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {lang === 'en' ? 'Where to paste' : 'Yapıştırma yeri'}
            </p>
            <p className="text-xs bg-muted/40 rounded-lg px-2.5 py-2 font-mono">{placement}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {lang === 'en' ? 'Steps' : 'Adımlar'}
            </p>
            <ol className="space-y-1.5">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs leading-relaxed">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyDemo}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied
                ? lang === 'en'
                  ? 'Copied'
                  : 'Kopyalandı'
                : lang === 'en'
                  ? 'Copy sample code'
                  : 'Örnek kodu kopyala'}
            </button>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors"
            >
              {lang === 'en' ? 'Get your code' : 'Kodunuzu alın'} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
