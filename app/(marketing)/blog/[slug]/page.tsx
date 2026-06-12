import type { Metadata } from 'next'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { JsonLd } from '@/components/marketing/json-ld'
import { BlogPostContent } from '@/components/marketing/blog-post-content'
import { notFound } from 'next/navigation'
import { BLOG_POSTS, getBlogPost } from '@/lib/blog-posts'
import { articleJsonLd, buildMetadata, breadcrumbJsonLd } from '@/lib/seo'
import { getServerLocaleContext } from '@/lib/locale-server'
import { getMarketingPages } from '@/lib/marketing-pages'

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { locale } = await getServerLocaleContext()
  const post = getBlogPost(slug, locale)
  const { blog } = getMarketingPages(locale)
  if (!post) return { title: blog.notFound }
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    keywords: post.keywords,
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { locale } = await getServerLocaleContext()
  const post = getBlogPost(slug, locale)
  const { blog } = getMarketingPages(locale)
  if (!post) notFound()

  return (
    <MarketingPageShell>
      <JsonLd
        data={[
          articleJsonLd({
            title: post.title,
            description: post.excerpt,
            path: `/blog/${slug}`,
            datePublished: post.dateIso,
          }),
          breadcrumbJsonLd([
            { name: blog.homeCrumb, path: '/' },
            { name: blog.blogCrumb, path: '/blog' },
            { name: post.title, path: `/blog/${slug}` },
          ]),
        ]}
      />
      <BlogPostContent slug={slug} post={post} />
    </MarketingPageShell>
  )
}
