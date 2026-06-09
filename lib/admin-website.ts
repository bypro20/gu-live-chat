import { prisma } from './db'

/** Platform yöneticisine (ADMIN rolü) ait siteler — tüm özellikler ücretsiz. */
export async function isAdminOwnedWebsite(websiteDbId: string): Promise<boolean> {
  const site = await prisma.website.findUnique({
    where: { id: websiteDbId },
    select: { owner: { select: { role: true } } },
  })
  return site?.owner?.role === 'ADMIN'
}

export function isPlatformAdminRole(role: string | undefined | null): boolean {
  return role === 'ADMIN'
}

export async function isPlatformAdminUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return user?.role === 'ADMIN'
}
