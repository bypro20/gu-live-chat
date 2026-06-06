import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'
import { z } from 'zod'

const articleSchema = z.object({
  websiteId: z.string(),
  title: z.string().min(1, 'Başlık gerekli'),
  slug: z.string().min(1, 'Slug gerekli'),
  content: z.string().min(1, 'İçerik gerekli'),
  excerpt: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  isFeatured: z.boolean().default(false),
  tags: z.string().optional(),
  order: z.number().default(0),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('websiteId')
  const categoryId = searchParams.get('categoryId')
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  if (!websiteId) return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })

  const website = await resolveWebsite(websiteId)
  if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'knowledgeBase')
  if (planDenied) return planDenied

  const where: Record<string, unknown> = { websiteId: website.id }
  if (categoryId) where.categoryId = categoryId
  if (status && status !== 'all') where.status = status
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { excerpt: { contains: search } },
    ]
  }

  const [articles, total] = await Promise.all([
    prisma.knowledgeArticle.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } }, author: { select: { id: true, name: true, image: true } } },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.knowledgeArticle.count({ where }),
  ])

  return NextResponse.json({ articles, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validated = articleSchema.parse(body)

    const website = await resolveWebsite(validated.websiteId)
    if (!website) return NextResponse.json({ error: 'Website bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: website.id, userId: session.user.id, role: { in: ['OWNER', 'ADMIN', 'MEMBER'] } },
    })
    if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

    const planDenied = await planFeatureDeniedAsync(website.id, website.plan, 'knowledgeBase')
    if (planDenied) return planDenied

    const existing = await prisma.knowledgeArticle.findUnique({
      where: { websiteId_slug: { websiteId: website.id, slug: validated.slug } },
    })
    if (existing) return NextResponse.json({ error: 'Bu slug ile zaten bir makale var' }, { status: 409 })

    const article = await prisma.knowledgeArticle.create({
      data: {
        websiteId: website.id,
        title: validated.title,
        slug: validated.slug,
        content: validated.content,
        excerpt: validated.excerpt || null,
        categoryId: validated.categoryId || null,
        status: validated.status,
        isFeatured: validated.isFeatured,
        tags: validated.tags || null,
        order: validated.order,
        authorId: session.user.id,
        publishedAt: validated.status === 'PUBLISHED' ? new Date() : null,
      },
      include: { category: { select: { id: true, name: true } } },
    })

    return NextResponse.json(article, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Makale oluşturulamadı' }, { status: 500 })
  }
}
