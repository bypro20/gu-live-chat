import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { IntegrationsPageContent } from '@/components/marketing/integrations-page-content'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('integrations')

export default function IntegrationsPage() {
  return (
    <MarketingPageShell contentClassName="max-w-6xl">
      <IntegrationsPageContent />
    </MarketingPageShell>
  )
}
