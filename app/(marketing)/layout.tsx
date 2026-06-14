import type { Metadata } from 'next'
import { MarketingProviders } from '@/components/marketing/marketing-providers'
import { MarketingWidgetLoader } from '@/components/marketing/marketing-widget-loader'
import { JsonLd } from '@/components/marketing/json-ld'
import { SourceProtection } from '@/components/marketing/source-protection'
import { organizationJsonLd } from '@/lib/seo'
import { getServerLocaleContext } from '@/lib/locale-server'

export const runtime = 'nodejs'
export const revalidate = 600

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const initialLocale = await getServerLocaleContext()

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <MarketingProviders initialLocale={initialLocale}>
        <div className="marketing-site min-h-screen min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-white text-foreground antialiased">
          <SourceProtection />
          {children}
          <MarketingWidgetLoader />
        </div>
      </MarketingProviders>
    </>
  )
}
