import type { Metadata } from 'next'
import { PanelDemoPage } from '@/components/marketing/panel-demo-page'
import { getServerLocaleContext } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getServerLocaleContext()
  const isTr = locale !== 'en'
  return buildMetadata({
    title: isTr ? 'Canlı Demo — Panel Turu | Gu Live Chat' : 'Live Demo — Panel Tour | Gu Live Chat',
    description: isTr
      ? 'Gu Live Chat panelindeki tüm menüler animasyonlu geçişlerle — Gelen Kutusu, Widget, Analitik ve daha fazlası.'
      : 'All Gu Live Chat panel menus with animated transitions — Inbox, Widget, Analytics, and more.',
    path: '/demo',
  })
}

export default function DemoPage() {
  return <PanelDemoPage />
}
