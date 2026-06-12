import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { FeaturesPageContent } from '@/components/marketing/features-page-content'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('features')

export default function FeaturesPage() {
  return (
    <MarketingPageShell>
      <FeaturesPageContent />
    </MarketingPageShell>
  )
}
