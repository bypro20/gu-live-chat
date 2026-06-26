import { PLAN_LIMITS } from '@/lib/constants'

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
