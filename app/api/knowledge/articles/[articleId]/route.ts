import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { planFeatureDeniedAsync } from '@/lib/plan-gate'
import { z } from 'zod'

const articleUpdateSchema = z.object({
  title: z.string().min(1, 'Başlık gerekli').optional(),
  slug: z.string().min(1, 'Slug gerekli').optional(),
  content: z.string().min(1, 'İçerik gerekli').optional(),
  excerpt: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  isFeatured: z.boolean().optional(),
  tags: z.string().nullable().optional(),
  order: z.number().optional(),
})

export async function GET(req: Request, { params }: { params: Promise<{ articleId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { articleId } = await params

  const article = await prisma.knowledgeArticle.findUnique({
    where: { id: articleId },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true, image: true } },
      website: { select: { id: true, plan: true } },
    },
  })
  if (!article) return NextResponse.json({ error: 'Makale bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: article.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const planDenied = await planFeatureDeniedAsync(article.website.id, article.website.plan, 'knowledgeBase')
  if (planDenied) return planDenied

  return NextResponse.json(article)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ articleId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { articleId } = await params

  try {
    const existing = await prisma.knowledgeArticle.findUnique({
      where: { id: articleId },
      include: { website: { select: { id: true, plan: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'Makale bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: existing.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

    const planDenied = await planFeatureDeniedAsync(existing.website.id, existing.website.plan, 'knowledgeBase')
    if (planDenied) return planDenied

    const body = await req.json()
    const validated = articleUpdateSchema.parse(body)

    if (validated.slug && validated.slug !== existing.slug) {
      const slugExists = await prisma.knowledgeArticle.findUnique({
        where: { websiteId_slug: { websiteId: existing.websiteId, slug: validated.slug } },
      })
      if (slugExists) return NextResponse.json({ error: 'Bu slug ile zaten bir makale var' }, { status: 409 })
    }

    const data: Record<string, unknown> = { ...validated }
    if (validated.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      data.publishedAt = new Date()
    }

    const article = await prisma.knowledgeArticle.update({
      where: { id: articleId },
      data,
      include: { category: { select: { id: true, name: true } } },
    })

    return NextResponse.json(article)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Makale güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ articleId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { articleId } = await params

  const existing = await prisma.knowledgeArticle.findUnique({
    where: { id: articleId },
    include: { website: { select: { id: true, plan: true } } },
  })
  if (!existing) return NextResponse.json({ error: 'Makale bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: existing.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const planDenied = await planFeatureDeniedAsync(existing.website.id, existing.website.plan, 'knowledgeBase')
  if (planDenied) return planDenied

  await prisma.knowledgeArticle.delete({ where: { id: articleId } })
  return NextResponse.json({ success: true })
}
