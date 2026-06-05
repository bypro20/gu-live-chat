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
  const period = searchParams.get('period') || '7d'

  if (!websiteId) {
    return NextResponse.json({ error: 'Website ID gerekli' }, { status: 400 })
  }

  const member = await prisma.teamMember.findFirst({
    where: { websiteId, userId: session.user.id },
  })
  if (!member) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  // Calculate date range
  const now = new Date()
  const periodDays = period === '30d' ? 30 : period === '7d' ? 7 : 1
  const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

  const [
    totalConversations,
    openConversations,
    resolvedConversations,
    todayConversations,
    uniqueVisitors,
  ] = await Promise.all([
    prisma.conversation.count({
      where: { websiteId, createdAt: { gte: startDate } },
    }),
    prisma.conversation.count({
      where: { websiteId, status: { in: ['OPEN', 'PENDING'] } },
    }),
    prisma.conversation.count({
      where: { websiteId, status: { in: ['RESOLVED', 'CLOSED'] }, createdAt: { gte: startDate } },
    }),
    prisma.conversation.count({
      where: {
        websiteId,
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      },
    }),
    prisma.visitor.count({
      where: { websiteId, createdAt: { gte: startDate } },
    }),
  ])

  // Avg response time (simplified - count of conversations with assignment)
  const assignedConversations = await prisma.conversation.count({
    where: { websiteId, assignedToId: { not: null }, createdAt: { gte: startDate } },
  })

  return NextResponse.json({
    totalConversations,
    openConversations,
    resolvedConversations,
    todayConversations,
    uniqueVisitors,
    resolutionRate: totalConversations > 0
      ? Math.round((resolvedConversations / totalConversations) * 100)
      : 0,
    avgResponseTime: '-',
    period,
  })
}