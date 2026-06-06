import { NextRequest, NextResponse } from 'next/server'
import { parseCallback } from '@/lib/paytr'
import { activateSubscription, handleFailedPayment } from '@/lib/subscription'
import { prisma } from '@/lib/db'
import { PLANS } from '@/lib/constants'

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
    const parts = merchantOid.split('_')

    if (parts.length < 2) {
      console.error('[PayTR Callback] Invalid merchant_oid format:', merchantOid)
      return new NextResponse('INVALID', { status: 400 })
    }

    const website = await prisma.website.findUnique({
      where: { paytrMerchantOid: merchantOid },
      select: { websiteId: true, plan: true, subscriptionStatus: true },
    })

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

    if (callbackData.status === 'success') {
      const planId = parts.length >= 3 ? parts[2] : 'FREE'
      const validPlans = ['STARTER', 'PRO', 'BUSINESS']
      const plan = validPlans.includes(planId) ? planId : 'STARTER'

      const planData = PLANS.find((p) => p.id === plan)
      const expectedAmount = planData ? Math.round(planData.price * 100) : 0
      if (expectedAmount > 0 && callbackData.totalAmount !== expectedAmount) {
        console.error(
          `[PayTR Callback] Amount mismatch for ${merchantOid}: expected ${expectedAmount}, got ${callbackData.totalAmount}`
        )
        return new NextResponse('INVALID', { status: 400 })
      }

      await activateSubscription(
        website.websiteId,
        plan as 'STARTER' | 'PRO' | 'BUSINESS',
        merchantOid,
        callbackData.utoken,
        callbackData.ctoken
      )

      console.log(`[PayTR Callback] Subscription activated: ${website.websiteId} -> ${plan}`)
    } else {
      await handleFailedPayment(website.websiteId)
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
