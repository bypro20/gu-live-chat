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
    const visitorId = searchParams.get('visitorId')
    const since = searchParams.get('since')

    const where: {
      websiteId?: string
      visitorId?: string
      startedAt?: { gte: Date }
    } = {}
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

    if (visitorId) {
      where.visitorId = visitorId
    }

    if (since) {
      const sinceMs: Record<string, number> = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
      }
      const ms = sinceMs[since]
      if (ms) {
        where.startedAt = { gte: new Date(Date.now() - ms) }
      }
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
