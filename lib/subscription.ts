import { prisma } from './db'
import { Plan, SubscriptionStatus } from '../app/generated/prisma/client'
import {
  createPaymentToken,
  processRecurringPayment,
  deleteStoredCard,
  generateMerchantOid,
  isPaytrConfigured,
} from './paytr'
import { PLANS, PLAN_LIMITS } from './constants'

// ─── Types ────────────────────────────────────────────────────────
interface SubscriptionInfo {
  plan: Plan
  status: SubscriptionStatus
  currentPeriodEnd: Date | null
  failedPayments: number
  paytrMerchantOid: string | null
}

// ─── Get Subscription Status ──────────────────────────────────────
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

// ─── Activate Subscription ────────────────────────────────────────
/**
 * Activate a subscription after successful payment
 */
export async function activateSubscription(
  websiteId: string,
  plan: Plan,
  merchantOid: string,
  utoken?: string,
  ctoken?: string
): Promise<void> {
  const planData = PLANS.find((p) => p.id === plan)
  if (!planData) {
    throw new Error(`Invalid plan: ${plan}`)
  }

  // Calculate period end (30 days from now for paid plans)
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
      paytrUserToken: utoken || undefined,
      paytrCardToken: ctoken || undefined,
      failedPayments: 0,
    },
    select: { id: true },
  })

  // Record a paid invoice so the billing history reflects real payments.
  // Non-fatal: a failure here should not block subscription activation.
  if (planData.price > 0) {
    try {
      await prisma.invoice.create({
        data: {
          websiteId: updated.id,
          plan,
          amount: planData.price * 100, // kuruş
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

// ─── Cancel Subscription ──────────────────────────────────────────
/**
 * Cancel a subscription and downgrade to FREE
 */
export async function cancelSubscription(
  websiteId: string
): Promise<void> {
  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: {
      paytrUserToken: true,
      paytrCardToken: true,
      plan: true,
    },
  })

  if (!website) {
    throw new Error('Website not found')
  }

  // Delete stored card from PayTR if exists
  if (website.paytrUserToken && website.paytrCardToken) {
    await deleteStoredCard(website.paytrCardToken, website.paytrUserToken)
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

// ─── Handle Failed Payment ────────────────────────────────────────
/**
 * Handle a failed recurring payment
 * After 3+ consecutive failures, downgrade to FREE
 */
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
    // Downgrade to FREE after 3 failed attempts
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

  // Mark as past due but keep current plan for now
  await prisma.website.update({
    where: { websiteId },
    data: {
      subscriptionStatus: 'PAST_DUE',
      failedPayments: newFailedCount,
    },
  })

  return { downgraded: false, failedPayments: newFailedCount }
}

// ─── Renew Subscription ───────────────────────────────────────────
/**
 * Process a recurring payment for an active subscription
 * Called by the cron job
 */
export async function renewSubscription(
  websiteId: string
): Promise<{ success: boolean; msg?: string }> {
  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: {
      id: true,
      plan: true,
      paytrUserToken: true,
      paytrCardToken: true,
      paytrMerchantOid: true,
      owner: { select: { email: true } },
    },
  })

  if (!website) {
    throw new Error('Website not found')
  }

  if (!website.paytrUserToken || !website.paytrCardToken) {
    console.error(
      `[Subscription] No stored card for website ${websiteId}, canceling`
    )
    await cancelSubscription(websiteId)
    return { success: false, msg: 'No stored card' }
  }

  const planData = PLANS.find((p) => p.id === website.plan)
  if (!planData || planData.price <= 0) {
    return { success: false, msg: 'Invalid plan for renewal' }
  }

  const merchantOid = generateMerchantOid(websiteId, website.plan)

  const result = await processRecurringPayment({
    merchantOid,
    utoken: website.paytrUserToken,
    ctoken: website.paytrCardToken,
    paymentAmount: planData.price,
    currency: 'TL',
    userEmail: website.owner?.email || '',
    userIp: '127.0.0.1', // Server-initiated, no user IP
  })

  if (result.status === 'wait_callback') {
    console.log(`[Subscription] Renewal pending callback for ${websiteId}`)
    return { success: true, msg: 'Payment pending callback' }
  }

  if (result.status === 'success') {
    // Extend subscription period by 30 days
    const periodStart = new Date()
    const newPeriodEnd = new Date()
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

    // Record a paid invoice for the renewal period (non-fatal).
    try {
      await prisma.invoice.create({
        data: {
          websiteId: website.id,
          plan: website.plan,
          amount: planData.price * 100, // kuruş
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

    return { success: true }
  }

  // Payment failed
  await handleFailedPayment(websiteId)
  return { success: false, msg: result.msg || 'Recurring payment failed' }
}

// ─── Initiate Checkout ─────────────────────────────────────────────
/**
 * Initiate a payment checkout by creating a PayTR token
 */
export async function initiateCheckout(
  websiteId: string,
  planId: string,
  userEmail: string,
  userName: string,
  userPhone: string,
  userIp: string
): Promise<{ token: string; merchantOid: string } | { error: string }> {
  const plan = PLANS.find((p) => p.id === planId)
  if (!plan || plan.price <= 0) {
    return { error: 'Geçersiz plan' }
  }

  if (!isPaytrConfigured()) {
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

  // Persist merchantOid BEFORE calling PayTR so the callback can find the
  // website by this field regardless of whether payment succeeds or fails.
  await prisma.website.update({
    where: { websiteId },
    data: { paytrMerchantOid: merchantOid },
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const result = await createPaymentToken({
    merchantOid,
    userEmail,
    userName,
    userPhone,
    userIp,
    paymentAmount: plan.price,
    currency: 'TL',
    installmentCount: 0, // Single payment
    okUrl: `${baseUrl}/settings/billing?payment=success`,
    failUrl: `${baseUrl}/settings/billing?payment=failed`,
    storeCard: true, // Required for recurring payments
  })

  if (result.status === 'success' && result.token) {
    return { token: result.token, merchantOid }
  }

  return { error: result.reason || 'Ödeme token\'ı alınamadı' }
}

// ─── Check Plan Limits ────────────────────────────────────────────
export function checkPlanLimit(
  plan: Plan,
  limitType: keyof (typeof PLAN_LIMITS)[Plan]
): number | boolean {
  return PLAN_LIMITS[plan][limitType]
}

/**
 * Check if a website can perform an action based on its plan limits
 */
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