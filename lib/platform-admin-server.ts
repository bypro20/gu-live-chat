import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isPlatformAdminRole } from '@/lib/platform-admin-shared'

/** Oturum açmış platform admin mi? */
export async function sessionHasUnlimitedAccess(): Promise<boolean> {
  try {
    const session = await auth()
    return isPlatformAdminRole(session?.user?.role)
  } catch {
    return false
  }
}

/** Platform admin oturumu veya site sahibi ADMIN rolünde — limitsiz erişim. */
export async function websiteHasUnlimitedAccess(websiteDbId: string): Promise<boolean> {
  if (await sessionHasUnlimitedAccess()) return true

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

/** Limitsiz sitelerde AI/model kısıtları BUSINESS gibi uygulanır. */
export async function resolveEffectivePlan<T extends string>(
  websiteDbId: string,
  plan: T
): Promise<T | 'BUSINESS'> {
  if (await websiteHasUnlimitedAccess(websiteDbId)) return 'BUSINESS'
  return plan
}
