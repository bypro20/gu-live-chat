import type { Metadata } from 'next'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { MobilV2 } from '@/components/marketing/home-v2/mobil-v2'
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
    keywords: ['gu live chat apk', 'gulivechat apk', 'canlı destek uygulaması', 'android indir', 'ana ekrana ekle'],
    locale: locale === 'en' ? 'en' : 'tr',
  })
}

export default function MobilIndirPage() {
  return (
    <div className="min-h-screen bg-[#07060d] text-foreground">
      <MarketingNav tone="dark" />
      <main>
        <MobilV2 />
      </main>
      <MarketingFooter tone="dark" />
    </div>
  )
}
