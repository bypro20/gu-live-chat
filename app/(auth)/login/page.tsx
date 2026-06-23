import type { Metadata } from 'next'
import GirisFormu from './login-form'
import { getServerLocaleContext } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'

const googleAktif = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerLocaleContext()
  const isTr = locale !== 'en'
  return buildMetadata({
    title: isTr ? 'Giriş Yap' : 'Sign In',
    description: isTr
      ? 'Gu Live Chat panelinize giriş yapın — gelen kutusu, ziyaretçiler ve ayarlar.'
      : 'Sign in to your Gu Live Chat dashboard — inbox, visitors, and settings.',
    path: '/login',
    locale: isTr ? 'tr' : 'en',
    robots: { index: false, follow: true },
  })
}

export default function GirisSayfasi() {
  return <GirisFormu googleAktif={googleAktif} />
}
