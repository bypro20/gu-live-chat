import { BLOG_POSTS } from '@/lib/blog-posts'
import { SITE_NAME } from '@/lib/site-config'
import { SITE_URL } from '@/lib/seo'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildBlogRssFeed() {
  const items = [...BLOG_POSTS]
    .sort((a, b) => b.dateIso.localeCompare(a.dateIso))
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${post.dateIso}T09:00:00.000Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)} Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>${escapeXml(`${SITE_NAME} — canlı destek, chatbot ve müşteri deneyimi rehberleri`)}</description>
    <language>tr</language>
    <atom:link href="${SITE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`
}
