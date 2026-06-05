import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWebsiteAccess, isErrorResponse } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const access = await requireWebsiteAccess(req)

  if (isErrorResponse(access)) return access

  const { website } = access
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || '7d'

  const now = new Date()
  let startDate: Date

  switch (period) {
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }

  const [
    totalVisitors,
    newVisitors,
    topPages,
  ] = await Promise.all([
    prisma.visitorSession.count({
      where: { websiteId: website.id, startedAt: { gte: startDate } },
    }),
    prisma.visitor.count({
      where: { websiteId: website.id, createdAt: { gte: startDate } },
    }),
    prisma.pageView.groupBy({
      by: ['url'],
      where: { session: { websiteId: website.id } },
      _count: { url: true },
      orderBy: { _count: { url: 'desc' } },
      take: 10,
    }),
  ])

  return NextResponse.json({
    totalVisitors,
    newVisitors,
    returningVisitors: Math.max(0, totalVisitors - newVisitors),
    topPages: topPages.map((p) => ({
      url: p.url,
      views: p._count.url,
    })),
    period,
  })
}