import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { JsonLd } from '@/components/marketing/json-ld'
import { notFound } from 'next/navigation'
import { BLOG_POSTS, BLOG_BY_SLUG } from '@/lib/blog-posts'
import { articleJsonLd, buildMetadata, breadcrumbJsonLd } from '@/lib/seo'
import { SocialShare } from '@/components/marketing/social-share'
import { trialShortLabel } from '@/lib/trial-config'

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = BLOG_BY_SLUG[slug]
  if (!post) return { title: 'Yazı bulunamadı' }
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    keywords: post.keywords,
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = BLOG_BY_SLUG[slug]
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
            { name: 'Ana Sayfa', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: `/blog/${slug}` },
          ]),
        ]}
      />
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Blog&apos;a dön
      </Link>
      <article itemScope itemType="https://schema.org/Article">
        <time className="text-xs text-muted-foreground" dateTime={post.dateIso} itemProp="datePublished">{post.date}</time>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2 mb-4" itemProp="headline">{post.title}</h1>
        <SocialShare title={post.title} path={`/blog/${slug}`} className="mb-8" />
        <div className="prose prose-neutral max-w-none space-y-4" itemProp="articleBody">
          {post.content.map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
          ))}
        </div>
        <div className="mt-12 p-6 surface text-center">
          <p className="font-semibold mb-3">Gu Chat ile hemen başlayın</p>
          <p className="text-sm text-muted-foreground mb-4">{trialShortLabel()} — kredi kartı gerekmez</p>
          <Link href="/register" className="btn-primary px-6 py-2.5 inline-flex">
            Ücretsiz Kayıt Ol
          </Link>
        </div>
      </article>
    </MarketingPageShell>
  )
}
