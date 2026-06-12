import { SeoLandingPageClient } from '@/components/marketing/seo-landing-page-client'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('chatbot')

export default function ChatbotPage() {
  return <SeoLandingPageClient page="chatbot" />
}
