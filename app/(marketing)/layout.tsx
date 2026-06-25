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
            background: '#FAFBFC',
            color: '#0F172A',
            ['--foreground' as string]: '#0F172A',
            ['--background' as string]: '#FAFBFC',
            ['--card' as string]: '#FFFFFF',
            ['--card-foreground' as string]: '#0F172A',
            ['--muted' as string]: '#F1F5F9',
            ['--muted-foreground' as string]: '#64748B',
            ['--border' as string]: '#E2E8F0',
            ['--primary' as string]: '#0B5FFF',
            ['--primary-hover' as string]: '#004EE0',
            ['--primary-foreground' as string]: '#ffffff',
            ['--marketing-hero' as string]: 'linear-gradient(180deg, #FFFFFF 0%, #F0F6FF 48%, #FAFBFC 100%)',
            ['--marketing-accent' as string]: '#0B5FFF',
            ['--marketing-navy' as string]: '#0B1220',
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
