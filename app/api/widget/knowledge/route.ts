import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'

/** Public knowledge base for widget + marketing pages (no auth). */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const websiteId = searchParams.get('websiteId')
    const type = searchParams.get('type') || 'articles'
    const articleId = searchParams.get('articleId')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')

    if (!websiteId) {
      return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
    }

    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, name: true, plan: true },
    })
    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'knowledgeBase')
    if (planDenied) return planDenied

    if (type === 'categories') {
      const categories = await prisma.knowledgeCategory.findMany({
        where: { websiteId: website.id },
        select: { id: true, name: true, slug: true, description: true, icon: true, order: true },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      })
      return NextResponse.json(categories)
    }

    if (articleId) {
      const article = await prisma.knowledgeArticle.findFirst({
        where: {
          websiteId: website.id,
          status: 'PUBLISHED',
          OR: [{ id: articleId }, { slug: articleId }],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          excerpt: true,
          isFeatured: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      })
      if (!article) {
        return NextResponse.json({ error: 'Makale bulunamadı' }, { status: 404 })
      }
      return NextResponse.json(article)
    }

    const where: Record<string, unknown> = {
      websiteId: website.id,
      status: 'PUBLISHED',
    }
    if (categoryId) where.categoryId = categoryId
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
      ]
    }

    const articles = await prisma.knowledgeArticle.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        isFeatured: true,
        order: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    })

    return NextResponse.json({ articles, websiteName: website.name })
  } catch (error) {
    console.error('[Widget Knowledge]', error)
    return NextResponse.json({ error: 'Yüklenemedi' }, { status: 500 })
  }
}
