'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SocialShare } from '@/components/marketing/social-share'
import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'
import type { BlogPost } from '@/lib/blog-posts'

export function BlogPostContent({ slug, post }: { slug: string; post: BlogPost }) {
  const { blog } = useMarketingPages()

  return (
    <>
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {blog.backToBlog}
      </Link>
      <article itemScope itemType="https://schema.org/Article">
        <time className="text-xs text-muted-foreground" dateTime={post.dateIso} itemProp="datePublished">
          {post.date}
        </time>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2 mb-4" itemProp="headline">
          {post.title}
        </h1>
        <SocialShare title={post.title} path={`/blog/${slug}`} className="mb-8" />
        <div className="prose prose-neutral max-w-none space-y-4" itemProp="articleBody">
          {post.content.map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">
              {p}
            </p>
          ))}
        </div>
        <div className="mt-12 p-6 surface text-center">
          <p className="font-semibold mb-3">{blog.ctaTitle}</p>
          <p className="text-sm text-muted-foreground mb-4">{blog.trialNote}</p>
          <Link href="/register" className="btn-primary px-6 py-2.5 inline-flex">
            {blog.ctaButton}
          </Link>
        </div>
      </article>
    </>
  )
}
