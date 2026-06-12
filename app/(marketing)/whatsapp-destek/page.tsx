import { SeoLandingPageClient } from '@/components/marketing/seo-landing-page-client'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('whatsappDestek')

export default function WhatsappDestekPage() {
  return <SeoLandingPageClient page="whatsappDestek" />
}
