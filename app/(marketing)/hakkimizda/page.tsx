import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { HakkimizdaPageContent } from '@/components/marketing/hakkimizda-page-content'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('hakkimizda')

export default function HakkimizdaPage() {
  return (
    <MarketingPageShell>
      <HakkimizdaPageContent />
    </MarketingPageShell>
  )
}
