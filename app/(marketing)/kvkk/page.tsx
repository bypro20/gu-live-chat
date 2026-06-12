import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { LegalPageContent } from '@/components/marketing/legal-page-content'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('kvkk')

export default function KvkkPage() {
  return (
    <MarketingPageShell>
      <LegalPageContent page="kvkk" />
    </MarketingPageShell>
  )
}
