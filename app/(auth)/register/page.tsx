import type { Metadata } from 'next'
import KayitFormu from './register-form'
import { getServerLocaleContext } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import { trialSeoHome } from '@/lib/trial-config'

const googleAktif = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerLocaleContext()
  const isTr = locale !== 'en'
  return buildMetadata({
    title: isTr ? 'Ücretsiz Hesap Oluştur' : 'Create Free Account',
    description: isTr
      ? `Gu Live Chat'e ücretsiz kayıt olun. Canlı sohbet, AI chatbot ve WhatsApp — tek platformda. ${trialSeoHome()}`
      : `Create your free Gu Live Chat account. Live chat, AI chatbot, and WhatsApp in one inbox. ${trialSeoHome()}`,
    path: '/register',
    keywords: isTr
      ? ['gu live chat kayıt', 'ücretsiz canlı destek', 'gulivechat register']
      : ['gu live chat signup', 'free live chat', 'gulivechat register'],
    locale: isTr ? 'tr' : 'en',
  })
}

export default function KayitSayfasi() {
  return <KayitFormu googleAktif={googleAktif} />
}
