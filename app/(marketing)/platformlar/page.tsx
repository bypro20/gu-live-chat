import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { PlatformlarPageContent } from '@/components/marketing/platformlar-page-content'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('platformlar')

export default function PlatformlarPage() {
  return (
    <MarketingPageShell contentClassName="max-w-6xl">
      <PlatformlarPageContent />
    </MarketingPageShell>
  )
}
