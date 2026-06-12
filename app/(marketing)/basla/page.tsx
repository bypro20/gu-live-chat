import type { Metadata } from 'next'
import { AdsLandingPage } from '@/components/marketing/ads-landing-page'
import { getServerLocaleContext } from '@/lib/locale-server'
import { getPageSeo } from '@/lib/seo-i18n'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerLocaleContext()
  return {
    ...buildMetadata(getPageSeo(locale, 'basla')),
    robots: { index: false, follow: false },
  }
}

export default function BaslaPage() {
  return <AdsLandingPage />
}
