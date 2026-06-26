import { MarketingProviders } from '@/components/marketing/marketing-providers'
import { MobileAndroidBar } from '@/components/marketing/mobile-android-bar'
import { MarketingWidgetLoader } from '@/components/marketing/marketing-widget-loader'
import { JsonLd } from '@/components/marketing/json-ld'
import { SourceProtection } from '@/components/marketing/source-protection'
import { organizationJsonLd } from '@/lib/seo'
import { getServerLocaleContext } from '@/lib/locale-server'
import { guBrandMarketingStyle } from '@/lib/brand-theme'

export const runtime = 'nodejs'
export const revalidate = 600

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const initialLocale = await getServerLocaleContext()

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <MarketingProviders initialLocale={initialLocale}>
        <div
          className="marketing-site min-h-screen min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden antialiased pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-0"
          style={guBrandMarketingStyle()}
        >
          <SourceProtection />
          {children}
          <MobileAndroidBar />
          <MarketingWidgetLoader />
        </div>
      </MarketingProviders>
    </>
  )
}
