import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://guchat.org'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/features',
    '/ai',
    '/apps',
    '/integrations',
    '/blog',
    '/blog/canli-destek-neden-onemli',
    '/blog/chatbot-kurulum-rehberi',
    '/blog/musteri-deneyimi-ipuclari',
    '/contact',
    '/help',
    '/login',
    '/register',
    '/hakkimizda',
    '/gizlilik',
    '/teslimat-iade',
    '/mesafeli-satis',
    '/odeme-guvenligi',
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
