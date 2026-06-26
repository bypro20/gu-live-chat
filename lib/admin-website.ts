import { prisma } from './db'
import {
  isPlatformAdminRole,
} from './platform-admin-shared'

export { isPlatformAdminRole, ADMIN_UNLIMITED_LIMITS, websiteHasUnlimitedAccess } from './platform-admin-shared'

/** Platform yöneticisine (ADMIN rolü) ait siteler — tüm özellikler ücretsiz. */
export async function isAdminOwnedWebsite(websiteDbId: string): Promise<boolean> {
  try {
    const site = await prisma.website.findUnique({
      where: { id: websiteDbId },
      select: { owner: { select: { role: true } } },
    })
    return site?.owner?.role === 'ADMIN'
  } catch {
    return false
  }
}

export async function isPlatformAdminUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return isPlatformAdminRole(user?.role)
}
