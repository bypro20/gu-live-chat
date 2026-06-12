'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { JsonLd } from '@/components/marketing/json-ld'
import { breadcrumbJsonLd, faqJsonLd, softwareApplicationJsonLd } from '@/lib/seo'
import { trialShortLabel } from '@/lib/trial-config'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'
import { useLocale, useT } from '@/components/marketing/locale-provider'
import { getPageSeo } from '@/lib/seo-i18n'
import type { SeoLandingKey } from '@/lib/marketing-pages/types'

export function SeoLandingPageClient({ page }: { page: SeoLandingKey }) {
  const { locale } = useLocale()
  const { seoLandings, seoChrome } = useMarketingPages()
  const t = useT()
  const config = seoLandings[page]
  const meta = getPageSeo(locale, page)

  return (
    <MarketingPageShell>
      <JsonLd
        data={[
          softwareApplicationJsonLd(),
          breadcrumbJsonLd([
            { name: seoChrome.homeCrumb, path: '/' },
            { name: meta.title.split('—')[0].trim(), path: meta.path },
          ]),
          faqJsonLd(config.faqs),
        ]}
      />

      <div className="mb-12">
        <p className="section-label mb-4">{config.badge}</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">{config.h1}</h1>
        <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-2xl">{config.subtitle}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href={config.cta.href} className="btn-primary px-8 py-3.5">
            {config.cta.label} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/pricing" className="btn-secondary px-8 py-3.5">
            {seoChrome.seePricing}
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{t.hero.trial}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
        {config.benefits.map((b) => (
          <div key={b.title} className="surface p-5">
            <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-3">
              <Check className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-base mb-2">{b.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>

      {config.sections.map((section) => (
        <section key={section.title} className="mb-12">
          <h2 className="text-2xl font-bold tracking-tight mb-4">{section.title}</h2>
          <div className="space-y-4">
            {section.paragraphs.map((p, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
            ))}
          </div>
        </section>
      ))}

      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-6">{seoChrome.faqTitle}</h2>
        <div className="space-y-3">
          {config.faqs.map((faq) => (
            <details key={faq.q} className="surface group">
              <summary className="px-5 py-4 font-medium cursor-pointer list-none flex items-center justify-between">
                {faq.q}
                <span className="text-muted-foreground group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>
      </section>

      <section className="surface p-8 text-center">
        <h2 className="text-xl font-bold mb-3">{seoChrome.tryFreeTitle}</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {seoChrome.tryFreeDesc(trialShortLabel())}
        </p>
        <Link href="/register" className="btn-primary px-8 py-3.5 inline-flex">
          {seoChrome.tryFreeCta} <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <nav className="mt-12 pt-8 border-t border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{seoChrome.relatedTitle}</p>
        <div className="flex flex-wrap gap-3">
          {config.relatedLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-primary hover:underline">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </MarketingPageShell>
  )
}
