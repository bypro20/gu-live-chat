import { NextRequest, NextResponse } from 'next/server'
import { parseCallback, parseMerchantOid } from '@/lib/paytr'
import {
  activateSubscription,
  handleFailedPayment,
  renewSubscriptionFromCallback,
} from '@/lib/subscription'
import { activateAddonFromPayment } from '@/lib/addon-purchase'
import { prisma } from '@/lib/db'
import { PLANS } from '@/lib/constants'
import type { Plan } from '@/app/generated/prisma/client'

async function findWebsiteForCallback(merchantOid: string) {
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const body: Record<string, string> = {}
    formData.forEach((value, key) => {
      body[key] = value.toString()
    })

    const callbackData = parseCallback(body)

    if (!callbackData) {
      console.error('[PayTR Callback] Invalid callback data or hash')
      return new NextResponse('INVALID', { status: 400 })
    }

    const merchantOid = callbackData.merchantOid
    const parsed = parseMerchantOid(merchantOid)

    if (!parsed) {
      console.error('[PayTR Callback] Invalid merchant_oid format:', merchantOid)
      return new NextResponse('INVALID', { status: 400 })
    }

    const website = await findWebsiteForCallback(merchantOid)

    if (!website) {
      console.error('[PayTR Callback] Website not found for merchant_oid:', merchantOid)
      return new NextResponse('INVALID', { status: 400 })
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: { paytrMerchantOid: merchantOid, status: 'PAID' },
      select: { id: true },
    })
    if (callbackData.status === 'success' && existingInvoice) {
      console.log(`[PayTR Callback] Already processed: ${merchantOid}`)
      return new NextResponse('OK', { status: 200 })
    }

    if (parsed.kind === 'addon') {
      if (callbackData.status === 'success') {
        const addon = await prisma.addon.findUnique({
          where: { slug: parsed.addonSlug },
          select: { price: true },
        })
        if (addon && addon.price > 0 && callbackData.totalAmount !== addon.price) {
          console.error(
            `[PayTR Callback] Addon amount mismatch for ${merchantOid}: expected ${addon.price}, got ${callbackData.totalAmount}`
          )
          return new NextResponse('INVALID', { status: 400 })
        }
        await activateAddonFromPayment(website.websiteId, parsed.addonSlug)
        console.log(`[PayTR Callback] Addon activated: ${parsed.addonSlug} for ${website.websiteId}`)
      } else {
        console.error(
          `[PayTR Callback] Addon payment failed for ${website.websiteId}: ${callbackData.failedReasonMsg || 'Unknown'}`
        )
      }
      return new NextResponse('OK', { status: 200 })
    }

    const validPlans = ['STARTER', 'PRO', 'BUSINESS']
    const planId = validPlans.includes(parsed.planId) ? parsed.planId : 'STARTER'
    const plan = planId as Plan

    if (callbackData.status === 'success') {
      const planData = PLANS.find((p) => p.id === plan)
      const expectedAmount = planData ? Math.round(planData.price * 100) : 0
      if (expectedAmount > 0 && callbackData.totalAmount !== expectedAmount) {
        console.error(
          `[PayTR Callback] Amount mismatch for ${merchantOid}: expected ${expectedAmount}, got ${callbackData.totalAmount}`
        )
        return new NextResponse('INVALID', { status: 400 })
      }

      const isRenewal =
        website.subscriptionStatus === 'ACTIVE' && website.plan === plan

      if (isRenewal) {
        await renewSubscriptionFromCallback(website.websiteId, merchantOid, plan)
        console.log(`[PayTR Callback] Subscription renewed: ${website.websiteId}`)
      } else {
        await activateSubscription(
          website.websiteId,
          plan,
          merchantOid,
          callbackData.utoken,
          callbackData.ctoken
        )
        console.log(`[PayTR Callback] Subscription activated: ${website.websiteId} -> ${plan}`)
      }
    } else {
      const isRecurringFailure =
        website.subscriptionStatus === 'PAST_DUE' ||
        (website.subscriptionStatus === 'ACTIVE' && website.plan === plan)

      if (isRecurringFailure) {
        await handleFailedPayment(website.websiteId)
      } else {
        console.log(
          `[PayTR Callback] Checkout failed for ${website.websiteId}, not treating as recurring failure`
        )
      }
      console.error(
        `[PayTR Callback] Payment failed for ${website.websiteId}: ${callbackData.failedReasonMsg || 'Unknown reason'}`
      )
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[PayTR Callback] Error:', error)
    return new NextResponse('ERROR', { status: 500 })
  }
}
