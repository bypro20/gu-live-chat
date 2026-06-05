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
    totalConversations,
    openConversations,
    resolvedConversations,
    dailyConversations,
  ] = await Promise.all([
    prisma.conversation.count({
      where: { websiteId: website.id, createdAt: { gte: startDate } },
    }),
    prisma.conversation.count({
      where: { websiteId: website.id, status: { in: ['OPEN', 'PENDING'] } },
    }),
    prisma.conversation.count({
      where: { websiteId: website.id, status: 'RESOLVED', closedAt: { gte: startDate } },
    }),
    prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT date(createdAt) as date, COUNT(*) as count
      FROM conversations
      WHERE websiteId = ${website.id} AND createdAt >= ${startDate}
      GROUP BY date(createdAt)
      ORDER BY date(createdAt) ASC
    `,
  ])

  return NextResponse.json({
    totalConversations,
    openConversations,
    resolvedConversations,
    resolutionRate: totalConversations > 0 ? Math.round((resolvedConversations / totalConversations) * 100) : 0,
    dailyConversations: dailyConversations.map((d) => ({
      date: d.date,
      count: Number(d.count),
    })),
    period,
  })
}