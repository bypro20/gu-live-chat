import { SeoLandingPageClient } from '@/components/marketing/seo-landing-page-client'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('smsDestek')

export default function SmsDestekPage() {
  return <SeoLandingPageClient page="smsDestek" />
}
