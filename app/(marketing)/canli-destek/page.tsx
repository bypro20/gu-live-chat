import { SeoLandingPageClient } from '@/components/marketing/seo-landing-page-client'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('canliDestek')

export default function CanliDestekPage() {
  return <SeoLandingPageClient page="canliDestek" />
}
