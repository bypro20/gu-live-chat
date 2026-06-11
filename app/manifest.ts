import type { MetadataRoute } from 'next'
import { SITE_LEGAL } from '@/lib/site-legal'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_LEGAL.name,
    short_name: 'Gu Chat',
    description: SITE_LEGAL.metaDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563EB',
    lang: 'tr',
    icons: [
      {
        src: '/app-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/app-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
