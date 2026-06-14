import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { channelLabel } from '@/lib/conversation-channels'

function formatDurationMs(ms: number): string {
  if (ms <= 0 || !Number.isFinite(ms)) return '-'
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec} sn`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} dk`
  const hr = Math.round(min / 60)
  return `${hr} sa`
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('websiteId')

  const userWebsites = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    select: { websiteId: true },
  })
  const websiteIds = userWebsites.map((m) => m.websiteId)

  let filteredWebsiteIds = websiteIds
  if (websiteId) {
    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true },
    })
    if (!website || !websiteIds.includes(website.id)) {
      return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
    }
    filteredWebsiteIds = [website.id]
  }

  if (filteredWebsiteIds.length === 0) {
    return NextResponse.json({
      openConversations: 0,
      todayConversations: 0,
      activeVisitors: 0,
      avgResponseTime: '-',
      totalConversations: 0,
      resolvedConversations: 0,
      channelBreakdown: [],
      agentPerformance: [],
      aiAgent: { active: false, autoReply: false },
      aiMetrics: { botReplies: 0, aiResolved: 0, aiResolutionRate: 0 },
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
    channelGroups,
    agentMessageGroups,
    aiConfig,
    botReplies,
    aiResolvedCount,
  ] = await Promise.all([
    prisma.conversation.count({
      where: {
        websiteId: { in: filteredWebsiteIds },
        status: { in: ['OPEN', 'PENDING'] },
      },
    }),
    prisma.conversation.count({
      where: {
        websiteId: { in: filteredWebsiteIds },
        createdAt: { gte: startOfDay },
      },
    }),
    prisma.conversation.count({
      where: {
        websiteId: { in: filteredWebsiteIds },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.conversation.count({
      where: {
        websiteId: { in: filteredWebsiteIds },
        status: 'RESOLVED',
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.visitorSession.count({
      where: {
        websiteId: { in: filteredWebsiteIds },
        lastActiveAt: { gte: new Date(now.getTime() - 5 * 60 * 1000) },
      },
    }),
    prisma.conversation.groupBy({
      by: ['source'],
      where: {
        websiteId: { in: filteredWebsiteIds },
        createdAt: { gte: startOfMonth },
      },
      _count: { id: true },
    }),
    prisma.message.groupBy({
      by: ['senderId'],
      where: {
        senderType: 'AGENT',
        senderId: { not: null },
        conversation: { websiteId: { in: filteredWebsiteIds } },
        createdAt: { gte: startOfMonth },
      },
      _count: { id: true },
    }),
    filteredWebsiteIds.length === 1
      ? prisma.aIConfig.findUnique({
          where: { websiteId: filteredWebsiteIds[0] },
          select: { isActive: true, autoReply: true },
        })
      : Promise.resolve(null),
    prisma.message.count({
      where: {
        senderType: 'BOT',
        createdAt: { gte: startOfMonth },
        conversation: { websiteId: { in: filteredWebsiteIds } },
      },
    }),
    prisma.conversation.count({
      where: {
        websiteId: { in: filteredWebsiteIds },
        status: { in: ['RESOLVED', 'CLOSED'] },
        assignedToId: null,
        createdAt: { gte: startOfMonth },
        messages: { some: { senderType: 'BOT' } },
      },
    }),
  ])

  const aiResolutionRate =
    totalConversations > 0
      ? Math.min(100, Math.round((aiResolvedCount / totalConversations) * 100))
      : 0

  // Ortalama ilk yanıt süresi (son 80 sohbet örneği)
  const recentConvs = await prisma.conversation.findMany({
    where: {
      websiteId: { in: filteredWebsiteIds },
      createdAt: { gte: startOfMonth },
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: 80,
  })

  let avgResponseTime = '-'
  if (recentConvs.length > 0) {
    const convIds = recentConvs.map((c) => c.id)
    const allMsgs = await prisma.message.findMany({
      where: { conversationId: { in: convIds } },
      select: { conversationId: true, senderType: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    const byConv = new Map<string, typeof allMsgs>()
    for (const msg of allMsgs) {
      const list = byConv.get(msg.conversationId) ?? []
      list.push(msg)
      byConv.set(msg.conversationId, list)
    }
    const diffs: number[] = []
    for (const convId of convIds) {
      const msgs = byConv.get(convId) ?? []
      const firstVisitor = msgs.find((m) => m.senderType === 'VISITOR')
      const firstAgent = msgs.find(
        (m) =>
          (m.senderType === 'AGENT' || m.senderType === 'BOT') &&
          firstVisitor &&
          m.createdAt > firstVisitor.createdAt
      )
      if (firstVisitor && firstAgent) {
        diffs.push(firstAgent.createdAt.getTime() - firstVisitor.createdAt.getTime())
      }
    }
    if (diffs.length > 0) {
      const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length
      avgResponseTime = formatDurationMs(avg)
    }
  }

  const channelBreakdown = channelGroups
    .map((g) => ({
      source: g.source,
      label: channelLabel(g.source),
      count: g._count.id,
    }))
    .sort((a, b) => b.count - a.count)

  const agentIds = agentMessageGroups
    .map((g) => g.senderId)
    .filter((id): id is string => !!id)

  const agents =
    agentIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: agentIds } },
          select: { id: true, name: true, image: true },
        })
      : []

  const resolvedByAgent = await prisma.conversation.groupBy({
    by: ['assignedToId'],
    where: {
      websiteId: { in: filteredWebsiteIds },
      status: 'RESOLVED',
      assignedToId: { not: null },
      createdAt: { gte: startOfMonth },
    },
    _count: { id: true },
  })

  const agentPerformance = agentMessageGroups
    .map((g) => {
      const user = agents.find((a) => a.id === g.senderId)
      const resolved =
        resolvedByAgent.find((r) => r.assignedToId === g.senderId)?._count.id ?? 0
      return {
        userId: g.senderId,
        name: user?.name || 'Temsilci',
        image: user?.image || null,
        messagesSent: g._count.id,
        resolved,
      }
    })
    .sort((a, b) => b.messagesSent - a.messagesSent)
    .slice(0, 8)

  return NextResponse.json({
    openConversations,
    todayConversations,
    activeVisitors: activeVisitorCount,
    avgResponseTime,
    totalConversations,
    resolvedConversations,
    channelBreakdown,
    agentPerformance,
    aiAgent: {
      active: aiConfig?.isActive ?? false,
      autoReply: aiConfig?.autoReply ?? false,
    },
    aiMetrics: {
      botReplies,
      aiResolved: aiResolvedCount,
      aiResolutionRate,
    },
  })
}
