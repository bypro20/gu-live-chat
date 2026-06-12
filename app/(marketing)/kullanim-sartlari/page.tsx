import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { LegalPageContent } from '@/components/marketing/legal-page-content'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('kullanimSartlari')

export default function KullanimPage() {
  return (
    <MarketingPageShell>
      <LegalPageContent page="kullanimSartlari" />
    </MarketingPageShell>
  )
}
