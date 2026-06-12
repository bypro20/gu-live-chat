import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { AppsPageContent } from '@/components/marketing/apps-page-content'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('apps')

export default function AppsPage() {
  return (
    <MarketingPageShell>
      <AppsPageContent />
    </MarketingPageShell>
  )
}
