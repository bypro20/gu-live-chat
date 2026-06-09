import type { Metadata } from 'next'
import { MarketingProviders } from '@/components/marketing/marketing-providers'
import { MarketingWidgetLoader } from '@/components/marketing/marketing-widget-loader'
import { SITE_LEGAL } from '@/lib/site-legal'

export const runtime = 'nodejs'
export const revalidate = 600

export const metadata: Metadata = {
  title: {
    default: `${SITE_LEGAL.name} — ${SITE_LEGAL.tagline}`,
    template: `%s | ${SITE_LEGAL.name}`,
  },
  description: SITE_LEGAL.metaDescription,
  keywords: ['canlı destek', 'live chat', 'chatbot', 'müşteri desteği', 'Gu Chat', 'guchat', 'müşteri hizmetleri'],
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://guchat.org',
    siteName: SITE_LEGAL.name,
    title: `${SITE_LEGAL.name} — ${SITE_LEGAL.tagline}`,
    description: SITE_LEGAL.metaDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_LEGAL.name} — ${SITE_LEGAL.tagline}`,
    description: SITE_LEGAL.metaDescription,
  },
  robots: { index: true, follow: true },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingProviders>
      <div className="marketing-site min-h-screen bg-white text-foreground antialiased">
        {children}
        <MarketingWidgetLoader />
      </div>
    </MarketingProviders>
  )
}
