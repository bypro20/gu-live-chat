import { getServerLocaleContext } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import { getPageSeo, type PageSeoKey } from '@/lib/seo-i18n'

export async function marketingMetadata(key: PageSeoKey) {
  const { locale } = await getServerLocaleContext()
  const meta = getPageSeo(locale, key)
  return buildMetadata({
    ...meta,
    locale: locale === 'en' ? 'en' : 'tr',
  })
}
