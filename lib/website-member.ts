import { prisma } from './db'

export async function getWebsiteForMember(userId: string, websitePublicId: string) {
  const website = await prisma.website.findUnique({
    where: { websiteId: websitePublicId },
    select: {
      id: true,
      plan: true,
      ownerId: true,
      members: { where: { userId }, select: { id: true, role: true } },
    },
  })
  if (!website) return null
  if (website.ownerId === userId || website.members.length > 0) return website
  return null
}

export async function isWebsiteAdmin(userId: string, websitePublicId: string) {
  const website = await prisma.website.findUnique({
    where: { websiteId: websitePublicId },
    select: {
      ownerId: true,
      members: { where: { userId }, select: { role: true } },
    },
  })
  if (!website) return false
  if (website.ownerId === userId) return true
  const role = website.members[0]?.role
  return role === 'OWNER' || role === 'ADMIN'
}
