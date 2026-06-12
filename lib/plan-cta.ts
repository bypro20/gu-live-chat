import type { SiteLocale } from './regional-config'
import { getBillingPlanCtaLabel } from './plan-i18n'

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
  iyzicoEnabled?: boolean
  locale?: SiteLocale
}

export function getMarketingPlanCta(
  planId: PlanId,
  { isLoggedIn = false, locale = 'tr' }: PlanCtaContext = {}
): { label: string; href: string } {
  const en = locale === 'en'

  if (planId === 'FREE') {
    return {
      label: en ? 'Start Free' : 'Ücretsiz Başla',
      href: isLoggedIn ? '/dashboard' : '/register',
    }
  }

  if (planId === 'BUSINESS') {
    return { label: en ? 'Contact Us' : 'İletişime Geç', href: '/contact' }
  }

  if (isLoggedIn) {
    return { label: en ? 'Buy Now' : 'Satın Al', href: `/settings/plans?plan=${planId}` }
  }

  return { label: en ? 'Buy Now' : 'Satın Al', href: `/register?plan=${planId}` }
}

export function getBillingPlanCta(
  planId: PlanId,
  { isCurrentPlan = false, locale = 'tr' }: PlanCtaContext = {}
): string {
  return getBillingPlanCtaLabel(planId, locale, { isCurrentPlan })
}
