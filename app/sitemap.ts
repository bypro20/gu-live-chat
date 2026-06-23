import type { MetadataRoute } from 'next'
import { BLOG_POSTS } from '@/lib/blog-posts'
import { SITE_URL } from '@/lib/seo'

const STATIC_ROUTES: Array<{
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency']
  lastModified?: string
}> = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/canli-destek', priority: 0.95, changeFrequency: 'weekly' },
  { path: '/chatbot', priority: 0.95, changeFrequency: 'weekly' },
  { path: '/whatsapp-destek', priority: 0.95, changeFrequency: 'weekly' },
  { path: '/pricing', priority: 0.92, changeFrequency: 'weekly' },
  { path: '/urunler', priority: 0.92, changeFrequency: 'weekly' },
  { path: '/register', priority: 0.88, changeFrequency: 'monthly' },
  { path: '/features', priority: 0.88, changeFrequency: 'monthly' },
  { path: '/ai', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/integrations', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/demo', priority: 0.84, changeFrequency: 'monthly' },
  { path: '/mobil-indir', priority: 0.82, changeFrequency: 'monthly' },
  { path: '/apps', priority: 0.78, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/help', priority: 0.65, changeFrequency: 'monthly' },
  { path: '/hakkimizda', priority: 0.55, changeFrequency: 'yearly' },
  { path: '/gizlilik', priority: 0.35, changeFrequency: 'yearly' },
  { path: '/teslimat-iade', priority: 0.35, changeFrequency: 'yearly' },
  { path: '/mesafeli-satis', priority: 0.35, changeFrequency: 'yearly' },
  { path: '/odeme-guvenligi', priority: 0.35, changeFrequency: 'yearly' },
  { path: '/kullanim-sartlari', priority: 0.35, changeFrequency: 'yearly' },
  { path: '/kvkk', priority: 0.35, changeFrequency: 'yearly' },
  { path: '/cerez-politikasi', priority: 0.35, changeFrequency: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const blogRoutes = BLOG_POSTS.map((post) => ({
    path: `/blog/${post.slug}`,
    priority: 0.72,
    changeFrequency: 'monthly' as const,
    lastModified: `${post.dateIso}T00:00:00.000Z`,
  }))

  const fallbackModified = new Date().toISOString()

  return [...STATIC_ROUTES, ...blogRoutes].map(({ path, priority, changeFrequency, lastModified }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: lastModified ?? fallbackModified,
    changeFrequency,
    priority,
  }))
}
