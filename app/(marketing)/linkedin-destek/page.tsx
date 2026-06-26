import { SeoLandingPageClient } from '@/components/marketing/seo-landing-page-client'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('linkedinDestek')

export default function LinkedinDestekPage() {
  return <SeoLandingPageClient page="linkedinDestek" />
}
