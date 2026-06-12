import { prisma } from './db'
import { parseMerchantOid } from './payment-orders'
import { retrieveCheckoutForm } from './iyzico'
import {
  activateSubscription,
  handleFailedPayment,
  renewSubscriptionFromCallback,
} from './subscription'
import { activateAddonFromPayment } from './addon-purchase'
import { isValidRegionalPlanPayment, currencyForRegionalPayment } from './checkout'
import type { PlanId } from './plan-cta'
import type { Plan } from '@/app/generated/prisma/client'

async function findWebsiteForOrder(merchantOid: string) {
  const byOid = await prisma.website.findUnique({
    where: { paytrMerchantOid: merchantOid },
    select: { websiteId: true, plan: true, subscriptionStatus: true },
  })
  if (byOid) return byOid

  const parsed = parseMerchantOid(merchantOid)
  if (!parsed) return null

  return prisma.website.findFirst({
    where: { websiteId: { endsWith: parsed.websiteIdSuffix } },
    select: { websiteId: true, plan: true, subscriptionStatus: true },
  })
}

export type PaymentProcessResult =
  | { ok: true; redirect: 'success' | 'failed' }
  | { ok: false; error: string }

export async function processIyzicoCallbackToken(
  token: string
): Promise<PaymentProcessResult> {
  const result = await retrieveCheckoutForm(token)

  if (result.status !== 'success') {
    console.error('[iyzico] retrieve failed:', result)
    return { ok: true, redirect: 'failed' }
  }

  if (result.paymentStatus !== 'SUCCESS') {
    const merchantOid = result.basketId || result.conversationId
    if (merchantOid) {
      const website = await findWebsiteForOrder(merchantOid)
      if (website) {
        const parsed = parseMerchantOid(merchantOid)
        if (parsed?.kind === 'plan') {
          const plan = parsed.planId as Plan
          const isRecurringFailure =
            website.subscriptionStatus === 'PAST_DUE' ||
            (website.subscriptionStatus === 'ACTIVE' && website.plan === plan)
          if (isRecurringFailure) {
            await handleFailedPayment(website.websiteId)
          }
        }
      }
    }
    return { ok: true, redirect: 'failed' }
  }

  const merchantOid = result.basketId || result.conversationId
  if (!merchantOid) {
    return { ok: false, error: 'Sipariş kimliği bulunamadı' }
  }

  const parsed = parseMerchantOid(merchantOid)
  if (!parsed) {
    return { ok: false, error: 'Geçersiz sipariş kimliği' }
  }

  const website = await findWebsiteForOrder(merchantOid)
  if (!website) {
    return { ok: false, error: 'Site bulunamadı' }
  }

  const existingInvoice = await prisma.invoice.findFirst({
    where: { paytrMerchantOid: merchantOid, status: 'PAID' },
    select: { id: true },
  })
  if (existingInvoice) {
    return { ok: true, redirect: 'success' }
  }

  if (parsed.kind === 'addon') {
    const addon = await prisma.addon.findUnique({
      where: { slug: parsed.addonSlug },
      select: { price: true },
    })
    if (addon && addon.price > 0) {
      const paidKurus = Math.round(parseFloat(result.paidPrice || '0') * 100)
      if (paidKurus !== addon.price) {
        console.error(
          `[iyzico] Addon amount mismatch for ${merchantOid}: expected ${addon.price}, got ${paidKurus}`
        )
        return { ok: true, redirect: 'failed' }
      }
    }
    await activateAddonFromPayment(website.websiteId, parsed.addonSlug)
    return { ok: true, redirect: 'success' }
  }

  const validPlans = ['STARTER', 'PRO', 'BUSINESS']
  const planId = validPlans.includes(parsed.planId) ? parsed.planId : 'STARTER'
  const plan = planId as Plan

  const paidAmount = parseFloat(result.paidPrice || '0')
  if (paidAmount <= 0 || !isValidRegionalPlanPayment(planId as PlanId, paidAmount)) {
    console.error(
      `[iyzico] Amount mismatch for ${merchantOid}: paid ${paidAmount} not valid for plan ${planId}`
    )
    return { ok: true, redirect: 'failed' }
  }

  const invoiceCurrency = currencyForRegionalPayment(planId as PlanId, paidAmount)
  const invoiceOpts = { paidAmount, currency: invoiceCurrency }

  const isRenewal =
    website.subscriptionStatus === 'ACTIVE' && website.plan === plan

  if (isRenewal) {
    await renewSubscriptionFromCallback(
      website.websiteId,
      merchantOid,
      plan,
      result.cardUserKey,
      result.cardToken,
      invoiceOpts
    )
  } else {
    await activateSubscription(
      website.websiteId,
      plan,
      merchantOid,
      result.cardUserKey,
      result.cardToken,
      invoiceOpts
    )
  }

  return { ok: true, redirect: 'success' }
}
