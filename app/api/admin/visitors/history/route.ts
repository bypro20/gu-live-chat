import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

/** GET /api/admin/visitors/history — Platform admin: all sites visitor sessions */
export async function GET(req: Request) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const websiteIdFilter = searchParams.get('websiteId')

    const where: { websiteId?: string } = {}
    if (websiteIdFilter) {
      const website = await prisma.website.findFirst({
        where: { OR: [{ websiteId: websiteIdFilter }, { id: websiteIdFilter }] },
        select: { id: true },
      })
      if (!website) {
        return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
      }
      where.websiteId = website.id
    }

    const [sessions, total] = await Promise.all([
      prisma.visitorSession.findMany({
        where,
        include: {
          visitor: {
            select: {
              id: true,
              name: true,
              email: true,
              browser: true,
              os: true,
              device: true,
              country: true,
              city: true,
            },
          },
          pages: {
            orderBy: { viewedAt: 'desc' },
            take: 50,
          },
          website: {
            select: { name: true, domain: true, websiteId: true },
          },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.visitorSession.count({ where }),
    ])

    return NextResponse.json({ sessions, total, page, limit })
  } catch (error) {
    console.error('[Admin Visitors History] Error:', error)
    return NextResponse.json({ error: 'Ziyaretçi geçmişi alınamadı' }, { status: 500 })
  }
}
