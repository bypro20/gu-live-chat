import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/site-config'

const BASE = getSiteUrl()

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
