import { prisma } from '@/lib/db'
import type { BlogPost } from '@/lib/blog-posts'
import { BLOG_POSTS, getBlogPosts } from '@/lib/blog-posts'
import type { SiteLocale } from '@/lib/regional-config'

type BlogRow = {
  slug: string
  title: string
  excerpt: string
  content: string
  keywords: string
  publishedAt: string | Date
}

function slugify(title: string): string {
  return title
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function formatTrDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function rowToBlogPost(row: BlogRow): BlogPost {
  let paragraphs: string[] = []
  try {
    paragraphs = JSON.parse(row.content) as string[]
  } catch {
    paragraphs = row.content.split('\n\n').filter(Boolean)
  }
  let keywords: string[] = []
  try {
    keywords = JSON.parse(row.keywords) as string[]
  } catch {
    keywords = []
  }
  const publishedAt =
    row.publishedAt instanceof Date
      ? row.publishedAt.toISOString()
      : String(row.publishedAt ?? new Date().toISOString())
  const dateIso = publishedAt.slice(0, 10)
  return {
    slug: row.slug,
    title: row.title,
    date: formatTrDate(dateIso),
    dateIso,
    excerpt: row.excerpt,
    content: paragraphs,
    keywords,
  }
}

async function queryBlogRows(locale: SiteLocale, slug?: string): Promise<BlogRow[]> {
  try {
    if (slug) {
      return await prisma.$queryRaw<BlogRow[]>`
        SELECT slug, title, excerpt, content, keywords, publishedAt
        FROM marketing_blog_posts
        WHERE locale = ${locale} AND slug = ${slug}
        LIMIT 1
      `
    }
    return await prisma.$queryRaw<BlogRow[]>`
      SELECT slug, title, excerpt, content, keywords, publishedAt
      FROM marketing_blog_posts
      WHERE locale = ${locale}
      ORDER BY publishedAt DESC
    `
  } catch {
    return []
  }
}

export async function listMarketingBlogPosts(locale: SiteLocale = 'tr'): Promise<BlogPost[]> {
  const rows = await queryBlogRows(locale)
  return rows.map(rowToBlogPost)
}

export async function getMarketingBlogPostBySlug(
  slug: string,
  locale: SiteLocale = 'tr'
): Promise<BlogPost | undefined> {
  const rows = await queryBlogRows(locale, slug)
  return rows[0] ? rowToBlogPost(rows[0]) : undefined
}

export async function getMergedBlogPosts(locale: SiteLocale): Promise<BlogPost[]> {
  const staticPosts = getBlogPosts(locale)
  const dynamicPosts = await listMarketingBlogPosts(locale)
  const staticSlugs = new Set(staticPosts.map((p) => p.slug))
  const merged = [...dynamicPosts.filter((p) => !staticSlugs.has(p.slug)), ...staticPosts]
  return merged.sort((a, b) => b.dateIso.localeCompare(a.dateIso))
}

export async function getMergedBlogPost(
  slug: string,
  locale: SiteLocale
): Promise<BlogPost | undefined> {
  const staticPost = getBlogPosts(locale).find((p) => p.slug === slug)
  if (staticPost) return staticPost
  return getMarketingBlogPostBySlug(slug, locale)
}

export async function getAllMarketingBlogSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.$queryRaw<Array<{ slug: string }>>`
      SELECT slug FROM marketing_blog_posts
    `
    return rows.map((r) => r.slug)
  } catch {
    return []
  }
}

export type CreateMarketingBlogInput = {
  title: string
  excerpt: string
  content: string[]
  keywords: string[]
  locale?: string
  source?: string
  taskId?: string
  slug?: string
}

export async function createMarketingBlogPost(input: CreateMarketingBlogInput) {
  const baseSlug = input.slug || slugify(input.title)
  let slug = baseSlug || `yazi-${Date.now()}`
  let n = 1
  while (true) {
    const existsStatic = BLOG_POSTS.some((p) => p.slug === slug)
    const existsDynamic = (await queryBlogRows('tr', slug)).length > 0
    if (!existsStatic && !existsDynamic) break
    slug = `${baseSlug}-${n++}`
  }

  const id = `mbp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
  const now = new Date().toISOString()
  const locale = input.locale ?? 'tr'
  const source = input.source ?? 'auto'

  await prisma.$executeRaw`
    INSERT INTO marketing_blog_posts (
      id, slug, title, excerpt, content, keywords, locale, publishedAt, source, taskId, createdAt, updatedAt
    ) VALUES (
      ${id},
      ${slug},
      ${input.title},
      ${input.excerpt},
      ${JSON.stringify(input.content)},
      ${JSON.stringify(input.keywords)},
      ${locale},
      ${now},
      ${source},
      ${input.taskId ?? null},
      ${now},
      ${now}
    )
  `

  return { id, slug, title: input.title, publishedAt: new Date(now) }
}

export async function getLastMarketingBlogPublishedAt(): Promise<Date | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ publishedAt: string }>>`
      SELECT publishedAt FROM marketing_blog_posts
      WHERE source = 'auto'
      ORDER BY publishedAt DESC
      LIMIT 1
    `
    return rows[0] ? new Date(rows[0].publishedAt) : null
  } catch {
    return null
  }
}
