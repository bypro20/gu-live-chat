import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://guchat.org'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/inbox/', '/admin/', '/api/', '/settings/'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
