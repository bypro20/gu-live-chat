import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { LegalPageContent } from '@/components/marketing/legal-page-content'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('cerez')

export default function CerezPage() {
  return (
    <MarketingPageShell>
      <LegalPageContent page="cerez" />
    </MarketingPageShell>
  )
}
