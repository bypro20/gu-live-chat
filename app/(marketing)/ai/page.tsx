import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { AiPageContent } from '@/components/marketing/ai-page-content'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('ai')

export default function AiPage() {
  return (
    <MarketingPageShell>
      <AiPageContent />
    </MarketingPageShell>
  )
}
