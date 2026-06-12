'use client'

import Link from 'next/link'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'
import { fillLegal } from '@/lib/marketing-pages/legal-utils'
import type { LegalPage } from '@/lib/marketing-pages/types'

export function LegalDocument({
  doc,
  showPayments,
}: {
  doc: LegalPage
  showPayments?: boolean
}) {
  const { common } = useMarketingPages()

  return (
    <>
      <div className="mb-10">
        <p className="section-label mb-4">{common.legal}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{doc.title}</h1>
        {doc.subtitle && (
          <p className="mt-4 text-muted-foreground leading-relaxed">{fillLegal(doc.subtitle)}</p>
        )}
        {doc.updated && <p className="mt-4 text-sm text-muted-foreground">{doc.updated}</p>}
      </div>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        {doc.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-foreground mb-2">{section.title}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className={i > 0 ? 'mt-2' : ''}>
                {fillLegal(p).split(/(\[[^\]]+\]\([^)]+\))/g).map((part, j) => {
                  const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
                  if (linkMatch) {
                    return (
                      <Link key={j} href={linkMatch[2]} className="text-primary hover:underline">
                        {linkMatch[1]}
                      </Link>
                    )
                  }
                  return part
                })}
              </p>
            ))}
            {showPayments && section.title.toLowerCase().includes('ssl') && (
              <div className="py-6">
                <PaymentLogos variant="footer" />
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  )
}
