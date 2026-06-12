import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { LegalPageContent } from '@/components/marketing/legal-page-content'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('odemeGuvenligi')

export default function OdemeGuvenligiPage() {
  return (
    <MarketingPageShell>
      <LegalPageContent page="odemeGuvenligi" showPayments />
    </MarketingPageShell>
  )
}
