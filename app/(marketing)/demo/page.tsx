import type { Metadata } from 'next'
import { PanelDemoPage } from '@/components/marketing/panel-demo-page'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata('demo')
}

export default function DemoPage() {
  return <PanelDemoPage />
}
