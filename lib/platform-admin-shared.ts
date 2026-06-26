import { auth } from '@/lib/auth'
import { PLAN_LIMITS } from '@/lib/constants'
import { prisma } from '@/lib/db'

/** Platform super-admin (user.role === 'ADMIN'), not team OWNER/ADMIN. */
export function isPlatformAdminRole(role?: string | null): boolean {
  return role === 'ADMIN'
}

/** Admin panel + platform admin oturumu: tüm özellikler açık, limit yok. */
export const ADMIN_UNLIMITED_LIMITS = {
  ...PLAN_LIMITS.BUSINESS,
  maxAgents: Infinity,
  maxConversationsPerMonth: Infinity,
} as const

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

export function unlimitedLimitsForDisplay() {
  return {
    plan: 'BUSINESS' as const,
    limits: ADMIN_UNLIMITED_LIMITS,
    usage: {
      conversations: { current: 0, limit: -1 },
      teamMembers: { current: 0, limit: -1 },
    },
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
