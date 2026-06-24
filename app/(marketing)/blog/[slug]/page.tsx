import type { Metadata } from 'next'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { JsonLd } from '@/components/marketing/json-ld'
import { BlogPostContent } from '@/components/marketing/blog-post-content'
import { notFound } from 'next/navigation'
import { BLOG_POSTS } from '@/lib/blog-posts'
import { getAllMarketingBlogSlugs, getMergedBlogPost } from '@/lib/marketing-blog'
import { articleJsonLd, buildMetadata, breadcrumbJsonLd } from '@/lib/seo'
import { getServerLocaleContext } from '@/lib/locale-server'
import { getMarketingPages } from '@/lib/marketing-pages'

export const dynamicParams = true
export const revalidate = 3600

export async function generateStaticParams() {
  const dynamicSlugs = await getAllMarketingBlogSlugs()
  const staticSlugs = BLOG_POSTS.map((post) => post.slug)
  const slugs = [...new Set([...staticSlugs, ...dynamicSlugs])]
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { locale } = await getServerLocaleContext()
  const post = await getMergedBlogPost(slug, locale)
  const { blog } = getMarketingPages(locale)
  if (!post) return { title: blog.notFound }
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    keywords: post.keywords,
    locale: locale === 'en' ? 'en' : 'tr',
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { locale } = await getServerLocaleContext()
  const post = await getMergedBlogPost(slug, locale)
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
            locale: locale === 'en' ? 'en' : 'tr',
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
