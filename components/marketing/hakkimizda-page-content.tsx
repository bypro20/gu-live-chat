'use client'

import Link from 'next/link'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'
import { fillLegal } from '@/lib/marketing-pages/legal-utils'
import { SITE_LEGAL } from '@/lib/site-legal'

export function HakkimizdaPageContent() {
  const { hakkimizda, common } = useMarketingPages()

  return (
    <>
      <div className="mb-10">
        <p className="section-label mb-4">{common.corporate}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{hakkimizda.title}</h1>
      </div>
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        {hakkimizda.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-foreground mb-2">{section.title}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className={i > 0 ? 'mt-2' : ''}>{fillLegal(p)}</p>
            ))}
          </section>
        ))}

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">{hakkimizda.corpFields.tradeName}</h2>
          <ul className="space-y-1 text-sm">
            <li><strong className="text-foreground">{hakkimizda.corpFields.tradeName}:</strong> {SITE_LEGAL.legalName}</li>
            <li><strong className="text-foreground">{hakkimizda.corpFields.address}:</strong> {SITE_LEGAL.address}</li>
            <li><strong className="text-foreground">{hakkimizda.corpFields.mersis}:</strong> {SITE_LEGAL.mersis}</li>
            <li><strong className="text-foreground">{hakkimizda.corpFields.taxOffice}:</strong> {SITE_LEGAL.taxOffice}</li>
            <li><strong className="text-foreground">{hakkimizda.corpFields.taxNo}:</strong> {SITE_LEGAL.taxNo}</li>
            <li><strong className="text-foreground">{hakkimizda.corpFields.email}:</strong> {SITE_LEGAL.email}</li>
            <li><strong className="text-foreground">{hakkimizda.corpFields.phone}:</strong> {SITE_LEGAL.phone}</li>
            <li><strong className="text-foreground">{hakkimizda.corpFields.web}:</strong> {SITE_LEGAL.url}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">{hakkimizda.servicesTitle}</h2>
          <p>{hakkimizda.servicesText}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">{hakkimizda.sslTitle}</h2>
          <p>{fillLegal(hakkimizda.sslText)}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">{hakkimizda.salesTitle}</h2>
          <p>
            {fillLegal(hakkimizda.salesText).split(/(\[[^\]]+\]\([^)]+\))/g).map((part, j) => {
              const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
              if (linkMatch) {
                return <Link key={j} href={linkMatch[2]} className="text-primary hover:underline">{linkMatch[1]}</Link>
              }
              return part
            })}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">{hakkimizda.paymentTitle}</h2>
          <p>{fillLegal(hakkimizda.paymentText)}</p>
          <div className="py-6">
            <PaymentLogos variant="footer" />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">{hakkimizda.legalDocsTitle}</h2>
          <ul className="text-sm space-y-1">
            {hakkimizda.legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-primary hover:underline">{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
