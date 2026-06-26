import { prisma } from '@/lib/db'

export async function assertConversationMemberAccess(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, websiteId: true, visitorId: true },
  })
  if (!conversation) return null

  const member = await prisma.teamMember.findFirst({
    where: { websiteId: conversation.websiteId, userId },
    select: { id: true },
  })
  if (!member) return null

  return conversation
}

export async function filterAccessibleConversationIds(userId: string, ids: string[]) {
  if (ids.length === 0) return []

  const unique = [...new Set(ids)]
  const conversations = await prisma.conversation.findMany({
    where: { id: { in: unique } },
    select: { id: true, websiteId: true },
  })
  if (conversations.length === 0) return []

  const websiteIds = [...new Set(conversations.map((c) => c.websiteId))]
  const memberships = await prisma.teamMember.findMany({
    where: { userId, websiteId: { in: websiteIds } },
    select: { websiteId: true },
  })
  const allowed = new Set(memberships.map((m) => m.websiteId))
  return conversations.filter((c) => allowed.has(c.websiteId)).map((c) => c.id)
}

export async function filterAdminInboxConversationIds(websiteDbId: string, ids: string[]) {
  if (ids.length === 0) return []
  const unique = [...new Set(ids)]
  const conversations = await prisma.conversation.findMany({
    where: { id: { in: unique }, websiteId: websiteDbId },
    select: { id: true },
  })
  return conversations.map((c) => c.id)
}

export async function refreshConversationPreview(conversationId: string) {
  const last = await prisma.message.findFirst({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    select: { content: true, createdAt: true },
  })

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessagePreview: last ? last.content.substring(0, 100) : null,
      lastMessageAt: last?.createdAt ?? new Date(),
    },
  })
}

export async function deleteConversationById(conversationId: string) {
  await prisma.conversation.delete({ where: { id: conversationId } })
}

export async function deleteConversationsByIds(conversationIds: string[]) {
  if (conversationIds.length === 0) return 0
  const result = await prisma.conversation.deleteMany({
    where: { id: { in: conversationIds } },
  })
  return result.count
}

export async function deleteMessageInConversation(conversationId: string, messageId: string) {
  const message = await prisma.message.findFirst({
    where: { id: messageId, conversationId },
    select: { id: true, type: true, senderType: true },
  })
  if (!message) return null
  if (message.senderType === 'SYSTEM' || message.type === 'SYSTEM') {
    throw new Error('SYSTEM_MESSAGE')
  }

  await prisma.message.delete({ where: { id: messageId } })
  await refreshConversationPreview(conversationId)
  return message
}
