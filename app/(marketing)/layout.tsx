import type { Metadata } from 'next'
import { MarketingProviders } from '@/components/marketing/marketing-providers'
import { MobileAndroidBar } from '@/components/marketing/mobile-android-bar'
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
        <div
          className="marketing-site min-h-screen min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden antialiased pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-0"
          style={{
            background: '#ffffff',
            color: '#111827',
            ['--foreground' as string]: '#111827',
            ['--background' as string]: '#ffffff',
            ['--card' as string]: '#ffffff',
            ['--card-foreground' as string]: '#111827',
            ['--muted' as string]: '#F9FAFB',
            ['--muted-foreground' as string]: '#6B7280',
            ['--border' as string]: '#E5E7EB',
            ['--primary' as string]: '#1D4ED8',
            ['--primary-foreground' as string]: '#ffffff',
          }}
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
