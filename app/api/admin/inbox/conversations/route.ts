import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { resolveAdminInboxSite } from '@/lib/admin-inbox-setup'

/** Admin gelen kutusu — marketing widget sohbetleri (takım üyeliği gerekmez). */
export async function GET(req: Request) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const site = await resolveAdminInboxSite(check.user.id)
    const website = { id: site.id }
    const publicWebsiteId = site.websiteId

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    const where = { websiteId: website.id }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          visitor: { select: { id: true, name: true, email: true, avatarUrl: true } },
          assignedTo: { select: { id: true, name: true, image: true } },
          _count: { select: { messages: true } },
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
      websiteId: publicWebsiteId,
    })
  } catch (error) {
    console.error('[Admin inbox conversations] error:', error)
    return NextResponse.json({ error: 'Sohbetler yüklenemedi' }, { status: 500 })
  }
}
