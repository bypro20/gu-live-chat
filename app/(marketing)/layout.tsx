import type { Metadata } from 'next'
import { MarketingProviders } from '@/components/marketing/marketing-providers'
import { MarketingWidgetLoader } from '@/components/marketing/marketing-widget-loader'
import { JsonLd } from '@/components/marketing/json-ld'
import { SourceProtection } from '@/components/marketing/source-protection'
import { MobileAndroidBar } from '@/components/marketing/mobile-android-bar'
import { organizationJsonLd } from '@/lib/seo'

export const runtime = 'nodejs'
export const revalidate = 600

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <MarketingProviders>
        <div className="marketing-site min-h-screen bg-white text-foreground antialiased pb-28 lg:pb-0">
          <SourceProtection />
          {children}
          <MarketingWidgetLoader />
          <MobileAndroidBar />
        </div>
      </MarketingProviders>
    </>
  )
}
