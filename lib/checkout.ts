import { generateMerchantOid } from './payment-orders'
import { prisma } from './db'
import { PLANS } from './constants'
import { initializeCheckoutForm, isIyzicoConfigured } from './iyzico'
import { getPlanPriceForCurrency, matchPlanPayment } from './regional-pricing'
import type { MarketRegion, PaymentCurrency } from './regional-config'
import type { PlanId } from './plan-cta'
import { getSiteUrl } from './site-config'

export async function initiateRegionalCheckout(params: {
  websiteId: string
  planId: string
  userEmail: string
  userName: string
  userPhone: string
  userIp: string
  returnTo: 'billing' | 'plans'
  region: MarketRegion
  currency: PaymentCurrency
  locale?: 'tr' | 'en'
}): Promise<
  | {
      provider: 'iyzico'
      token?: string
      merchantOid: string
      checkoutFormContent?: string
      paymentPageUrl?: string
      currency: PaymentCurrency
    }
  | { error: string }
> {
  const planId = params.planId as PlanId
  const regional = getPlanPriceForCurrency(params.currency, planId)
  if (regional.monthly <= 0) {
    return { error: 'Invalid plan' }
  }

  const plan = PLANS.find((p) => p.id === planId)
  if (!plan) return { error: 'Invalid plan' }

  if (!isIyzicoConfigured()) {
    return { error: 'Ödeme sistemi henüz yapılandırılmamış' }
  }

  const website = await prisma.website.findUnique({
    where: { websiteId: params.websiteId },
    select: { plan: true },
  })
  if (!website) return { error: 'Website not found' }

  const merchantOid = generateMerchantOid(params.websiteId, planId)
  await prisma.website.update({
    where: { websiteId: params.websiteId },
    data: { paytrMerchantOid: merchantOid },
  })

  const baseUrl = getSiteUrl()
  const locale = params.locale ?? (params.region === 'TR' ? 'tr' : 'en')

  const result = await initializeCheckoutForm({
    conversationId: merchantOid,
    basketId: merchantOid,
    price: regional.monthly,
    itemName: `Gu Live Chat ${plan.name}`,
    callbackUrl: `${baseUrl}/api/iyzico/callback${params.returnTo === 'plans' ? '?return=plans' : ''}`,
    buyerEmail: params.userEmail,
    buyerName: params.userName,
    buyerPhone: params.userPhone,
    buyerIp: params.userIp,
    locale,
    currency: regional.currency,
  })

  if ('error' in result) return { error: result.error }

  return {
    provider: 'iyzico',
    currency: regional.currency,
    token: result.token,
    merchantOid,
    checkoutFormContent: result.checkoutFormContent,
    paymentPageUrl: result.paymentPageUrl,
  }
}

/** Callback doğrulama — tüm iyzico para birimlerindeki fiyatlarla eşleşmeli */
export function isValidRegionalPlanPayment(planId: PlanId, paidAmount: number): boolean {
  return matchPlanPayment(planId, paidAmount)?.matched ?? false
}

export function currencyForRegionalPayment(planId: PlanId, paidAmount: number): PaymentCurrency {
  return matchPlanPayment(planId, paidAmount)?.currency ?? 'EUR'
}
