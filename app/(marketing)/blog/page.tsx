import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { BlogPageContent } from '@/components/marketing/blog-page-content'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'

export const generateMetadata = () => marketingMetadata('blog')

export default function BlogPage() {
  return (
    <MarketingPageShell>
      <BlogPageContent />
    </MarketingPageShell>
  )
}
