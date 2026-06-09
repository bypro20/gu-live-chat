import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MarketingPageShell } from '@/components/marketing/marketing-page-shell'
import { buildMetadata, PAGE_SEO } from '@/lib/seo'
import { BLOG_POSTS } from '@/lib/blog-posts'

export const metadata: Metadata = buildMetadata(PAGE_SEO.blog)

export default function BlogPage() {
  return (
    <MarketingPageShell>
      <div className="mb-12">
        <p className="section-label mb-4">Blog</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Canlı Destek & Müşteri Hizmetleri Rehberleri</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Canlı destek, chatbot, WhatsApp destek ve müşteri deneyimi hakkında pratik rehberler. Satış ve memnuniyeti artırın.
        </p>
      </div>

      <div className="space-y-6">
        {BLOG_POSTS.map((post) => (
          <article key={post.slug} className="surface p-6 hover:border-border-strong transition-colors">
            <time className="text-xs text-muted-foreground" dateTime={post.dateIso}>{post.date}</time>
            <h2 className="text-xl font-semibold mt-2 mb-2">
              <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                {post.title}
              </Link>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
            <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4 hover:text-primary-hover">
              Devamını oku <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </article>
        ))}
      </div>
    </MarketingPageShell>
  )
}
