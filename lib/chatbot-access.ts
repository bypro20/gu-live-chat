import { prisma } from './db'

type WebsiteRef = { id: string; ownerId: string }

/** Site sahibi veya OWNER/ADMIN takım üyesi chatbot yönetebilir. */
export async function canManageChatbots(website: WebsiteRef, userId: string): Promise<boolean> {
  if (website.ownerId === userId) return true
  const member = await prisma.teamMember.findFirst({
    where: {
      websiteId: website.id,
      userId,
      role: { in: ['OWNER', 'ADMIN'] },
    },
    select: { id: true },
  })
  return !!member
}

/** Herhangi bir takım üyesi chatbot listesini görebilir. */
export async function canViewChatbots(website: WebsiteRef, userId: string): Promise<boolean> {
  if (website.ownerId === userId) return true
  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId },
    select: { id: true },
  })
  return !!member
}
