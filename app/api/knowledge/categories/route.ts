import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const categorySchema = z.object({
  websiteId: z.string(),
  name: z.string().min(1, 'Kategori adı gerekli'),
  slug: z.string().min(1, 'Slug gerekli'),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().default(0),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('websiteId')

  if (!websiteId) return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId, userId: session.user.id },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const categories = await prisma.knowledgeCategory.findMany({
    where: { websiteId },
    include: { _count: { select: { articles: true } } },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(categories)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const validated = categorySchema.parse(body)

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: validated.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN', 'MEMBER'] } },
    })
    if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

    const existing = await prisma.knowledgeCategory.findUnique({
      where: { websiteId_slug: { websiteId: validated.websiteId, slug: validated.slug } },
    })
    if (existing) return NextResponse.json({ error: 'Bu slug ile zaten bir kategori var' }, { status: 409 })

    const category = await prisma.knowledgeCategory.create({
      data: {
        websiteId: validated.websiteId,
        name: validated.name,
        slug: validated.slug,
        description: validated.description || null,
        icon: validated.icon || null,
        order: validated.order,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Kategori oluşturulamadı' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Kategori ID gerekli' }, { status: 400 })

    const existing = await prisma.knowledgeCategory.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Kategori bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: existing.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
    })
    if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

    if (updates.slug && updates.slug !== existing.slug) {
      const slugExists = await prisma.knowledgeCategory.findUnique({
        where: { websiteId_slug: { websiteId: existing.websiteId, slug: updates.slug } },
      })
      if (slugExists) return NextResponse.json({ error: 'Bu slug ile zaten bir kategori var' }, { status: 409 })
    }

    const category = await prisma.knowledgeCategory.update({
      where: { id },
      data: updates,
    })

    return NextResponse.json(category)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: 'Geçersiz veri', details: (error as { issues: unknown[] }).issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Kategori güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Kategori ID gerekli' }, { status: 400 })

  const existing = await prisma.knowledgeCategory.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Kategori bulunamadı' }, { status: 404 })

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: existing.websiteId, userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
  })
  if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  await prisma.knowledgeArticle.updateMany({
    where: { categoryId: id },
    data: { categoryId: null },
  })

  await prisma.knowledgeCategory.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
