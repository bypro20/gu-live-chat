import { buildBlogRssFeed } from '@/lib/blog-feed'

export const revalidate = 3600

export async function GET() {
  return new Response(buildBlogRssFeed(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
