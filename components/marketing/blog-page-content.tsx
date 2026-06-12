'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getBlogPosts } from '@/lib/blog-posts'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'
import { useLocale } from '@/components/marketing/locale-provider'

export function BlogPageContent() {
  const { blog } = useMarketingPages()
  const { locale } = useLocale()
  const posts = getBlogPosts(locale)

  return (
    <>
      <div className="mb-12">
        <p className="section-label mb-4">{blog.badge}</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{blog.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{blog.subtitle}</p>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.slug} className="surface p-6 hover:border-border-strong transition-colors">
            <time className="text-xs text-muted-foreground" dateTime={post.dateIso}>{post.date}</time>
            <h2 className="text-xl font-semibold mt-2 mb-2">
              <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                {post.title}
              </Link>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
            <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4 hover:text-primary-hover">
              {blog.readMore} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </article>
        ))}
      </div>
    </>
  )
}
