import type { Metadata } from 'next'
import { buildMetadata, PAGE_SEO } from '@/lib/seo'

export const metadata: Metadata = buildMetadata(PAGE_SEO.pricing)

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
