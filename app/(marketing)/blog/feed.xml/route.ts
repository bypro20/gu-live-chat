import { buildBlogRssFeed } from '@/lib/blog-feed'

export const revalidate = 3600

export async function GET() {
  const feed = await buildBlogRssFeed()
  return new Response(feed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
