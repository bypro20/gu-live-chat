'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'

export function HelpPageContent() {
  const { help } = useMarketingPages()

  return (
    <>
      <div className="mb-12">
        <p className="section-label mb-4">{help.badge}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{help.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{help.subtitle}</p>
      </div>

      <div className="space-y-10">
        {help.categories.map((cat) => (
          <div key={cat.title}>
            <h2 className="text-lg font-bold mb-4">{cat.title}</h2>
            <div className="space-y-3">
              {cat.articles.map((a) => (
                <details key={a.q} className="surface group">
                  <summary className="p-4 cursor-pointer font-medium text-sm list-none flex items-center justify-between hover:bg-muted/30 transition-colors">
                    {a.q}
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{a.a}</div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 surface p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">{help.notFound}</p>
        <Link href="/contact" className="btn-primary">
          {help.contactCta} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </>
  )
}
