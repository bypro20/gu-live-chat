import type { Metadata } from 'next'
import { AdsLandingPage } from '@/components/marketing/ads-landing-page'

export const metadata: Metadata = {
  title: 'Ücretsiz Canlı Destek — Hemen Başla',
  description: 'Gu Chat ile 30 saniyede canlı sohbet kurun. 7 gün ücretsiz PRO deneme, kredi kartı gerekmez.',
  robots: { index: false, follow: false },
}

export default function BaslaPage() {
  return <AdsLandingPage />
}
