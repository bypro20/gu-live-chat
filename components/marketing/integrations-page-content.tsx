'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'
import { useT } from '@/components/marketing/locale-provider'

function StatusBadge({ status }: { status: 'active' | 'addon' }) {
  const { common } = useMarketingPages()
  return (
    <span
      className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
        status === 'active' ? 'bg-success-light text-success' : 'bg-primary-light text-primary'
      }`}
    >
      {status === 'active' ? common.active : common.addon}
    </span>
  )
}

export function IntegrationsPageContent() {
  const { integrations: p, common } = useMarketingPages()
  const t = useT()

  return (
    <>
      <div className="mb-12">
        <p className="section-label mb-4">{p.badge}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{p.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">{p.subtitle}</p>
      </div>

      {(
        [
          { title: p.messagingTitle, subtitle: p.messagingSubtitle, items: p.messaging },
          { title: p.automationTitle, subtitle: p.automationSubtitle, items: p.automation },
        ] as const
      ).map((section) => (
        <section key={section.title} className="mb-14">
          <h2 className="text-xl font-bold mb-1">{section.title}</h2>
          <p className="text-sm text-muted-foreground mb-5">{section.subtitle}</p>
          <div className="space-y-3">
            {section.items.map((item) => (
              <div key={item.name} className="surface p-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  {item.href && (
                    <Link href={item.href} className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2 hover:text-primary-hover">
                      {common.seeDetails} <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="mb-14">
        <h2 className="text-xl font-bold mb-1">{p.ecommerceTitle}</h2>
        <p className="text-sm text-muted-foreground mb-5">{p.ecommerceSubtitle}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {p.ecommerce.map((item) => (
            <div key={item.name} className="surface p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-sm">{item.name}</h3>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="surface p-6 sm:p-8 text-center">
        <h2 className="text-lg font-bold">{p.ctaTitle}</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-5 max-w-md mx-auto">{p.ctaSubtitle}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register" className="btn-primary">
            {t.nav.startFree} <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            {p.customIntegration}
          </Link>
        </div>
      </div>
    </>
  )
}
