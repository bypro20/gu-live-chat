import { prisma } from './db'
import { Plan, SubscriptionStatus } from '../app/generated/prisma/client'
import { generateMerchantOid } from './payment-orders'
import { initializeCheckoutForm, isIyzicoConfigured } from './iyzico'
import { PLANS, PLAN_LIMITS } from './constants'

interface SubscriptionInfo {
  plan: Plan
  status: SubscriptionStatus
  currentPeriodEnd: Date | null
  failedPayments: number
  paytrMerchantOid: string | null
}

export async function getSubscriptionStatus(
  websiteId: string
): Promise<SubscriptionInfo> {
  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: {
      plan: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      failedPayments: true,
      paytrMerchantOid: true,
    },
  })

  if (!website) {
    throw new Error('Website not found')
  }

  return {
    plan: website.plan,
    status: website.subscriptionStatus,
    currentPeriodEnd: website.currentPeriodEnd,
    failedPayments: website.failedPayments,
    paytrMerchantOid: website.paytrMerchantOid,
  }
}

export async function activateSubscription(
  websiteId: string,
  plan: Plan,
  merchantOid: string
): Promise<void> {
  const planData = PLANS.find((p) => p.id === plan)
  if (!planData) {
    throw new Error(`Invalid plan: ${plan}`)
  }

  const periodStart = new Date()
  const currentPeriodEnd = new Date()
  currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30)

  const updated = await prisma.website.update({
    where: { websiteId },
    data: {
      plan,
      subscriptionStatus: 'ACTIVE',
      currentPeriodEnd: planData.price > 0 ? currentPeriodEnd : null,
      paytrMerchantOid: merchantOid,
      failedPayments: 0,
    },
    select: { id: true },
  })

  if (planData.price > 0) {
    try {
      await prisma.invoice.create({
        data: {
          websiteId: updated.id,
          plan,
          amount: planData.price * 100,
          currency: 'TRY',
          status: 'PAID',
          periodStart,
          periodEnd: currentPeriodEnd,
          paytrMerchantOid: merchantOid,
        },
      })
    } catch (err) {
      console.error('[Subscription] Failed to record invoice:', err)
    }
  }
}

export async function cancelSubscription(websiteId: string): Promise<void> {
  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: { plan: true },
  })

  if (!website) {
    throw new Error('Website not found')
  }

  await prisma.website.update({
    where: { websiteId },
    data: {
      plan: 'FREE',
      subscriptionStatus: 'CANCELED',
      currentPeriodEnd: null,
      paytrMerchantOid: null,
      paytrUserToken: null,
      paytrCardToken: null,
      failedPayments: 0,
    },
  })
}

export async function handleFailedPayment(
  websiteId: string
): Promise<{ downgraded: boolean; failedPayments: number }> {
  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: { failedPayments: true },
  })

  if (!website) {
    throw new Error('Website not found')
  }

  const newFailedCount = website.failedPayments + 1

  if (newFailedCount >= 3) {
    await prisma.website.update({
      where: { websiteId },
      data: {
        plan: 'FREE',
        subscriptionStatus: 'PAST_DUE',
        failedPayments: newFailedCount,
      },
    })
    return { downgraded: true, failedPayments: newFailedCount }
  }

  await prisma.website.update({
    where: { websiteId },
    data: {
      subscriptionStatus: 'PAST_DUE',
      failedPayments: newFailedCount,
    },
  })

  return { downgraded: false, failedPayments: newFailedCount }
}

/** Recurring auto-charge is not supported without stored cards — manual renewal via checkout. */
export async function renewSubscription(
  websiteId: string
): Promise<{ success: boolean; msg?: string }> {
  console.log(`[Subscription] Auto-renew skipped for ${websiteId} — iyzico manual checkout required`)
  return { success: false, msg: 'Manual renewal required' }
}

export async function renewSubscriptionFromCallback(
  websiteId: string,
  merchantOid: string,
  plan: Plan
): Promise<void> {
  const planData = PLANS.find((p) => p.id === plan)
  if (!planData) {
    throw new Error(`Invalid plan: ${plan}`)
  }

  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: { id: true, currentPeriodEnd: true },
  })
  if (!website) {
    throw new Error('Website not found')
  }

  const now = new Date()
  const base =
    website.currentPeriodEnd && website.currentPeriodEnd > now
      ? website.currentPeriodEnd
      : now
  const periodStart = new Date()
  const newPeriodEnd = new Date(base)
  newPeriodEnd.setDate(newPeriodEnd.getDate() + 30)

  await prisma.website.update({
    where: { websiteId },
    data: {
      subscriptionStatus: 'ACTIVE',
      currentPeriodEnd: newPeriodEnd,
      paytrMerchantOid: merchantOid,
      failedPayments: 0,
    },
  })

  if (planData.price > 0) {
    try {
      await prisma.invoice.create({
        data: {
          websiteId: website.id,
          plan,
          amount: planData.price * 100,
          currency: 'TRY',
          status: 'PAID',
          periodStart,
          periodEnd: newPeriodEnd,
          paytrMerchantOid: merchantOid,
        },
      })
    } catch (err) {
      console.error('[Subscription] Failed to record renewal invoice:', err)
    }
  }
}

export async function initiateCheckout(
  websiteId: string,
  planId: string,
  userEmail: string,
  userName: string,
  userPhone: string,
  userIp: string
): Promise<
  | {
      token: string
      merchantOid: string
      checkoutFormContent?: string
      paymentPageUrl?: string
    }
  | { error: string }
> {
  const plan = PLANS.find((p) => p.id === planId)
  if (!plan || plan.price <= 0) {
    return { error: 'Geçersiz plan' }
  }

  if (!isIyzicoConfigured()) {
    return { error: 'Ödeme sistemi henüz yapılandırılmamış' }
  }

  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: { plan: true },
  })

  if (!website) {
    return { error: 'Site bulunamadı' }
  }

  const merchantOid = generateMerchantOid(websiteId, planId)

  await prisma.website.update({
    where: { websiteId },
    data: { paytrMerchantOid: merchantOid },
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const result = await initializeCheckoutForm({
    conversationId: merchantOid,
    basketId: merchantOid,
    priceTry: plan.price,
    itemName: `Gu Chat ${plan.name} Planı`,
    callbackUrl: `${baseUrl}/api/iyzico/callback`,
    buyerEmail: userEmail,
    buyerName: userName,
    buyerPhone: userPhone,
    buyerIp: userIp,
  })

  if ('error' in result) {
    return { error: result.error }
  }

  return {
    token: result.token,
    merchantOid,
    checkoutFormContent: result.checkoutFormContent,
    paymentPageUrl: result.paymentPageUrl,
  }
}

export function checkPlanLimit(
  plan: Plan,
  limitType: keyof (typeof PLAN_LIMITS)[Plan]
): number | boolean {
  return PLAN_LIMITS[plan][limitType]
}

export function canPerformAction(
  plan: Plan,
  limitType: keyof (typeof PLAN_LIMITS)[Plan],
  currentCount?: number
): boolean {
  const limit = PLAN_LIMITS[plan][limitType]

  if (limit === Infinity) return true
  if (typeof limit === 'boolean') return limit
  if (currentCount === undefined) return true

  return currentCount < limit
}
