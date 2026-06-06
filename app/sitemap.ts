import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://guchat.org'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/features',
    '/integrations',
    '/blog',
    '/contact',
    '/help',
    '/login',
    '/register',
    '/gizlilik',
    '/kullanim-sartlari',
    '/kvkk',
    '/cerez-politikasi',
  ]

  return routes.map((route) => ({
    url: `${BASE}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.7,
  }))
}
