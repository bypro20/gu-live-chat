import type { Metadata } from 'next'
import { MarketingProviders } from '@/components/marketing/marketing-providers'
import { MarketingWidgetLoader } from '@/components/marketing/marketing-widget-loader'

export const runtime = 'nodejs'
export const revalidate = 600

export const metadata: Metadata = {
  title: {
    default: 'Gu Chat — Profesyonel Canlı Destek Platformu',
    template: '%s | Gu Chat',
  },
  description:
    'Web sitenize ekleyebileceğiniz profesyonel canlı destek sistemi. Gerçek zamanlı mesajlaşma, chatbot, ziyaretçi takibi ve analitik — Türk yapımı.',
  keywords: ['canlı destek', 'live chat', 'chatbot', 'müşteri desteği', 'Gu Chat', 'guchat'],
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://guchat.org',
    siteName: 'Gu Chat',
    title: 'Gu Chat — Profesyonel Canlı Destek Platformu',
    description: 'Müşterilerinizle anında bağlantı kurun. Türk yapımı canlı destek platformu.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gu Chat — Profesyonel Canlı Destek Platformu',
    description: 'Müşterilerinizle anında bağlantı kurun.',
  },
  robots: { index: true, follow: true },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingProviders>
      <div className="min-h-screen bg-white text-foreground antialiased">
        {children}
        <MarketingWidgetLoader />
      </div>
    </MarketingProviders>
  )
}
