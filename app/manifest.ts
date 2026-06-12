import type { MetadataRoute } from 'next'
import { SITE_LEGAL } from '@/lib/site-legal'
import { SITE_NAME_SHORT } from '@/lib/site-config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_LEGAL.name,
    short_name: SITE_NAME_SHORT,
    description: SITE_LEGAL.metaDescription,
    start_url: '/login?app=android',
    display: 'fullscreen',
    background_color: '#0B1220',
    theme_color: '#0B1220',
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
