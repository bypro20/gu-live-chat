import type { Metadata } from 'next'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { MobilIndirContent } from '@/components/marketing/mobil-indir-content'
import { getServerLocaleContext } from '@/lib/locale-server'
import { getMessages } from '@/lib/messages'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerLocaleContext()
  const m = getMessages(locale).home.mobilPage
  return buildMetadata({
    title: m.metaTitle,
    description: m.metaDescription,
    path: '/mobil-indir',
    keywords: ['gu live chat apk', 'gulivechat apk', 'canlı destek uygulaması', 'android indir'],
    ogImage: '/app-icon.png',
  })
}

export default function MobilIndirPage() {
  return (
    <MarketingPageShell>
      <MobilIndirContent />
    </MarketingPageShell>
  )
}
