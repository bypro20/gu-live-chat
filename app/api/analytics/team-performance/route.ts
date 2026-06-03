import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireWebsiteAccess, isErrorResponse } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const access = await requireWebsiteAccess(req)

  if (isErrorResponse(access)) return access

  const { website } = access

  const members = await prisma.teamMember.findMany({
    where: { websiteId: website.id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  })

  const agentStats = await Promise.all(
    members.map(async (member) => {
      const [assignedConversations, resolvedConversations, totalMessages] =
        await Promise.all([
          prisma.conversation.count({
            where: { websiteId: website.id, assignedToId: member.userId },
          }),
          prisma.conversation.count({
            where: { websiteId: website.id, assignedToId: member.userId, status: 'RESOLVED' },
          }),
          prisma.message.count({
            where: { senderId: member.userId, senderType: 'AGENT', conversation: { websiteId: website.id } },
          }),
        ])

      return {
        userId: member.userId,
        name: member.user.name || member.user.email?.split('@')[0],
        email: member.user.email,
        image: member.user.image,
        role: member.role,
        assignedConversations,
        resolvedConversations,
        totalMessages,
        resolutionRate: assignedConversations > 0 ? Math.round((resolvedConversations / assignedConversations) * 100) : 0,
      }
    })
  )

  return NextResponse.json({
    agents: agentStats,
    totalAgents: members.length,
  })
}