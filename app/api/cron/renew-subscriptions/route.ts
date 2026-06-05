import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { renewSubscription } from '@/lib/subscription'

// GET /api/cron/renew-subscriptions
// Called by cron job (e.g., Vercel Cron) daily at 02:00
// Processes all subscriptions where currentPeriodEnd <= today
export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const providedSecret = authHeader?.replace('Bearer ', '')

  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find all active subscriptions that need renewal
    const now = new Date()
    const expiringWebsites = await prisma.website.findMany({
      where: {
        subscriptionStatus: 'ACTIVE',
        currentPeriodEnd: { lte: now },
        plan: { not: 'FREE' },
        paytrUserToken: { not: null },
        paytrCardToken: { not: null },
      },
      select: {
        websiteId: true,
        plan: true,
        paytrUserToken: true,
        paytrCardToken: true,
      },
    })

    console.log(
      `[Cron] Found ${expiringWebsites.length} subscription(s) to renew`
    )

    const results = {
      total: expiringWebsites.length,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const website of expiringWebsites) {
      try {
        const result = await renewSubscription(website.websiteId)
        if (result.success) {
          results.succeeded++
        } else {
          results.failed++
          results.errors.push(
            `${website.websiteId}: ${result.msg || 'Unknown error'}`
          )
        }
      } catch (error) {
        results.failed++
        results.errors.push(
          `${website.websiteId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    // Also handle PAST_DUE subscriptions that have been failing for too long
    // (3+ failed payments already triggers downgrade in handleFailedPayment)
    const pastDueWebsites = await prisma.website.findMany({
      where: {
        subscriptionStatus: 'PAST_DUE',
        failedPayments: { gte: 3 },
        plan: { not: 'FREE' },
      },
      select: { websiteId: true },
    })

    for (const website of pastDueWebsites) {
      try {
        // Downgrade to FREE
        await prisma.website.update({
          where: { websiteId: website.websiteId },
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
        console.log(
          `[Cron] Downgraded ${website.websiteId} to FREE (3+ failed payments)`
        )
      } catch (error) {
        results.errors.push(
          `Downgrade ${website.websiteId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return NextResponse.json({
      message: 'Cron job completed',
      results,
    })
  } catch (error) {
    console.error('[Cron] Renew subscriptions error:', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}