import type { Metadata } from 'next'
import { MarketingProviders } from '@/components/marketing/marketing-providers'
import { MarketingWidgetLoader } from '@/components/marketing/marketing-widget-loader'
import { JsonLd } from '@/components/marketing/json-ld'
import { buildMetadata, organizationJsonLd, PAGE_SEO } from '@/lib/seo'

export const runtime = 'nodejs'
export const revalidate = 600

export const metadata: Metadata = buildMetadata(PAGE_SEO.home)

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingProviders>
      <JsonLd data={organizationJsonLd()} />
      <div className="marketing-site min-h-screen bg-white text-foreground antialiased">
        {children}
        <MarketingWidgetLoader />
      </div>
    </MarketingProviders>
  )
}
