import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { LegalPageContent } from '@/components/marketing/legal-page-content'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('gizlilik')

export default function GizlilikPage() {
  return (
    <MarketingPageShell>
      <LegalPageContent page="gizlilik" showPayments />
    </MarketingPageShell>
  )
}
