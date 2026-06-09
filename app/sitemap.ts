import type { MetadataRoute } from 'next'
import { BLOG_POSTS } from '@/lib/blog-posts'
import { SITE_URL } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'] }> = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/canli-destek', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/chatbot', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/whatsapp-destek', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/features', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/ai', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/integrations', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/apps', priority: 0.75, changeFrequency: 'monthly' },
    { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/help', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/register', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/hakkimizda', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/gizlilik', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/teslimat-iade', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/mesafeli-satis', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/odeme-guvenligi', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/kullanim-sartlari', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/kvkk', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/cerez-politikasi', priority: 0.3, changeFrequency: 'yearly' },
  ]

  const blogRoutes = BLOG_POSTS.map((post) => ({
    path: `/blog/${post.slug}`,
    priority: 0.75,
    changeFrequency: 'monthly' as const,
  }))

  const now = new Date()

  return [...staticRoutes, ...blogRoutes].map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}
