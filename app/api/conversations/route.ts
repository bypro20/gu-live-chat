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
  const status = searchParams.get('status')
  const source = searchParams.get('source')
  const assignedTo = searchParams.get('assignedTo')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')

  // Get user's websites
  const userWebsites = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    select: { websiteId: true },
  })
  const websiteIds = userWebsites.map((m) => m.websiteId)

  // If a specific websiteId is requested, verify access
  let filteredWebsiteIds = websiteIds
  if (websiteId) {
    // Find the internal database ID for the given websiteId
    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true },
    })
    if (website && websiteIds.includes(website.id)) {
      filteredWebsiteIds = [website.id]
    } else {
      return NextResponse.json({ error: 'Bu siteye erişim yetkiniz yok' }, { status: 403 })
    }
  }

  const where: Record<string, unknown> = {
    websiteId: { in: filteredWebsiteIds },
  }

  if (status && status !== 'all') where.status = status
  if (source && source !== 'all') where.source = source
  if (assignedTo === 'me') where.assignedToId = session.user.id
  if (assignedTo === 'unassigned') where.assignedToId = null
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { visitor: { name: { contains: search, mode: 'insensitive' } } },
      { visitor: { email: { contains: search, mode: 'insensitive' } } },
      { lastMessagePreview: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      include: {
        visitor: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignedTo: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.conversation.count({ where }),
  ])

  return NextResponse.json({
    conversations,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}