import { NextRequest, NextResponse } from 'next/server'
import { parseCallback } from '@/lib/paytr'
import { activateSubscription, handleFailedPayment } from '@/lib/subscription'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const body: Record<string, string> = {}
    formData.forEach((value, key) => {
      body[key] = value.toString()
    })

    // Parse and verify callback
    const callbackData = parseCallback(body)

    if (!callbackData) {
      console.error('[PayTR Callback] Invalid callback data or hash')
      return new NextResponse('INVALID', { status: 400 })
    }

    // Extract websiteId from merchantOid format: gu_{websiteIdSuffix}_{planId}_{timestamp}_{random}
    const merchantOid = callbackData.merchantOid
    const parts = merchantOid.split('_')

    if (parts.length < 2) {
      console.error('[PayTR Callback] Invalid merchant_oid format:', merchantOid)
      return new NextResponse('INVALID', { status: 400 })
    }

    // Find website by paytrMerchantOid
    const website = await prisma.website.findUnique({
      where: { paytrMerchantOid: merchantOid },
      select: { websiteId: true, plan: true },
    })

    if (!website) {
      console.error('[PayTR Callback] Website not found for merchant_oid:', merchantOid)
      return new NextResponse('INVALID', { status: 400 })
    }

    if (callbackData.status === 'success') {
      // Determine plan from merchant_oid
      const planId = parts.length >= 3 ? parts[2] : 'FREE'
      const validPlans = ['STARTER', 'PRO', 'BUSINESS']
      const plan = validPlans.includes(planId) ? planId : 'STARTER'

      await activateSubscription(
        website.websiteId,
        plan as 'STARTER' | 'PRO' | 'BUSINESS',
        merchantOid,
        callbackData.utoken,
        callbackData.ctoken
      )

      console.log(
        `[PayTR Callback] Subscription activated: ${website.websiteId} -> ${plan}`
      )
    } else {
      // Payment failed
      await handleFailedPayment(website.websiteId)
      console.error(
        `[PayTR Callback] Payment failed for ${website.websiteId}: ${callbackData.failedReasonMsg || 'Unknown reason'}`
      )
    }

    // PayTR requires "OK" response
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[PayTR Callback] Error:', error)
    return new NextResponse('ERROR', { status: 500 })
  }
}