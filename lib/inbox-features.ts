import { PLAN_LIMITS, type PlanType } from '@/lib/constants'
import { ADMIN_UNLIMITED_LIMITS, isPlatformAdminRole } from '@/lib/platform-admin-shared'

export function getInboxPlanLimits(
  plan: PlanType | string | undefined,
  userRole?: string | null
) {
  if (isPlatformAdminRole(userRole)) return ADMIN_UNLIMITED_LIMITS
  const key = (plan || 'FREE') as PlanType
  return PLAN_LIMITS[key] ?? PLAN_LIMITS.FREE
}

export function inboxCanTranslate(plan: PlanType | string | undefined, userRole?: string | null) {
  return getInboxPlanLimits(plan, userRole).autoTranslate
}

export function inboxCanUpload(plan: PlanType | string | undefined, userRole?: string | null) {
  return getInboxPlanLimits(plan, userRole).fileUpload
}

export function inboxCanAi(plan: PlanType | string | undefined, userRole?: string | null) {
  return getInboxPlanLimits(plan, userRole).aiAssistant
}

export function inboxCanCanned(plan: PlanType | string | undefined, userRole?: string | null) {
  return getInboxPlanLimits(plan, userRole).cannedResponses
}
