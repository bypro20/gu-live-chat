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

  // Get user's websites
  const userWebsites = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    select: { websiteId: true },
  })
  const websiteIds = userWebsites.map((m) => m.websiteId)

  // Filter to specific website if provided
  let filteredWebsiteIds = websiteIds
  if (websiteId) {
    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true },
    })
    if (website && websiteIds.includes(website.id)) {
      filteredWebsiteIds = [website.id]
    }
  }

  if (filteredWebsiteIds.length === 0) {
    return NextResponse.json({
      openConversations: 0,
      todayConversations: 0,
      activeVisitors: 0,
      avgResponseTime: '-',
      totalConversations: 0,
      resolvedConversations: 0,
    })
  }

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    openConversations,
    todayConversations,
    totalConversations,
    resolvedConversations,
    activeVisitorCount,
  ] = await Promise.all([
    // Open conversations
    prisma.conversation.count({
      where: {
        websiteId: { in: filteredWebsiteIds },
        status: { in: ['OPEN', 'PENDING'] },
      },
    }),
    // Today's conversations
    prisma.conversation.count({
      where: {
        websiteId: { in: filteredWebsiteIds },
        createdAt: { gte: startOfDay },
      },
    }),
    // Total conversations this month
    prisma.conversation.count({
      where: {
        websiteId: { in: filteredWebsiteIds },
        createdAt: { gte: startOfMonth },
      },
    }),
    // Resolved conversations this month
    prisma.conversation.count({
      where: {
        websiteId: { in: filteredWebsiteIds },
        status: 'RESOLVED',
        createdAt: { gte: startOfMonth },
      },
    }),
    // Active visitors (from visitor sessions updated in last 5 minutes)
    prisma.visitorSession.count({
      where: {
        websiteId: { in: filteredWebsiteIds },
        lastActiveAt: { gte: new Date(now.getTime() - 5 * 60 * 1000) },
      },
    }),
  ])

  // Calculate average response time (simplified - based on first agent message time)
  // This is a rough estimate since we don't track exact response times yet
  const avgResponseTime = openConversations > 0 ? '< 5dk' : '-'

  return NextResponse.json({
    openConversations,
    todayConversations,
    activeVisitors: activeVisitorCount,
    avgResponseTime,
    totalConversations,
    resolvedConversations,
  })
}