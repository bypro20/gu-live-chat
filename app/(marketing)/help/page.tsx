import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { HelpPageContent } from '@/components/marketing/help-page-content'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('help')

export default function HelpPage() {
  return (
    <MarketingPageShell>
      <HelpPageContent />
    </MarketingPageShell>
  )
}
