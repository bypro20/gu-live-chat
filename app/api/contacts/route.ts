import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('websiteId')
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')

  if (!websiteId) {
    return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })
  }

  // Verify membership
  const member = await prisma.teamMember.findFirst({
    where: { websiteId, userId: session.user.id },
  })

  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  const where: Record<string, unknown> = { websiteId }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [visitors, total] = await Promise.all([
    prisma.visitor.findMany({
      where,
      include: {
        _count: { select: { conversations: true } },
        sessions: {
          orderBy: { lastActiveAt: 'desc' },
          take: 1,
          select: { currentPage: true, lastActiveAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.visitor.count({ where }),
  ])

  return NextResponse.json({ visitors, total, page, totalPages: Math.ceil(total / limit) })
}