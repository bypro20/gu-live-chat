import { SeoLandingPageClient } from '@/components/marketing/seo-landing-page-client'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('sesliAi')

export default function SesliAiPage() {
  return <SeoLandingPageClient page="sesliAi" />
}
