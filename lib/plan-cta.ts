export type PlanId = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS'

const PLAN_NAME_TO_ID: Record<string, PlanId> = {
  Ücretsiz: 'FREE',
  Başlangıç: 'STARTER',
  Profesyonel: 'PRO',
  Kurumsal: 'BUSINESS',
}

export function planIdFromName(name: string): PlanId {
  return PLAN_NAME_TO_ID[name] ?? 'FREE'
}

export interface PlanCtaContext {
  isLoggedIn?: boolean
  trialUsed?: boolean
  isCurrentPlan?: boolean
  paytrEnabled?: boolean
}

export function getMarketingPlanCta(
  planId: PlanId,
  { isLoggedIn = false }: PlanCtaContext = {}
): { label: string; href: string } {
  if (planId === 'FREE') {
    return {
      label: 'Ücretsiz Başla',
      href: isLoggedIn ? '/dashboard' : '/register',
    }
  }

  if (planId === 'BUSINESS') {
    return { label: 'İletişime Geç', href: '/contact' }
  }

  if (isLoggedIn) {
    return { label: 'Satın Al', href: `/settings/billing?plan=${planId}` }
  }

  return { label: 'Denemeyi Başlat', href: `/register?plan=${planId}` }
}

export function getBillingPlanCta(
  planId: PlanId,
  {
    isCurrentPlan = false,
    trialUsed = false,
    currentPlan = 'FREE',
    paytrEnabled = true,
  }: PlanCtaContext & { currentPlan?: PlanId } = {}
): string {
  if (isCurrentPlan) return 'Mevcut Plan'
  if (planId === 'FREE') return 'Ücretsiz Plan'
  if (planId === 'BUSINESS') return 'İletişime Geç'
  if (!paytrEnabled) return 'Yakında'
  if (currentPlan === 'FREE' && !trialUsed && planId === 'PRO') return 'Denemeyi Başlat'
  return 'Satın Al'
}
