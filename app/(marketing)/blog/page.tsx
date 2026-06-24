import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { BlogPageContent } from '@/components/marketing/blog-page-content'
import { marketingMetadata } from '@/lib/marketing-pages/metadata'
import { getMergedBlogPosts } from '@/lib/marketing-blog'
import { getServerLocaleContext } from '@/lib/locale-server'

export const generateMetadata = () => marketingMetadata('blog')
export const revalidate = 3600

export default async function BlogPage() {
  const { locale } = await getServerLocaleContext()
  const posts = await getMergedBlogPosts(locale)

  return (
    <MarketingPageShell>
      <BlogPageContent posts={posts} />
    </MarketingPageShell>
  )
}
