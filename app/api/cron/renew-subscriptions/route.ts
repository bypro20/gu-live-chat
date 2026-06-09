import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const providedSecret = authHeader?.replace('Bearer ', '')

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET tanımlı değil — istek reddedildi')
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 })
  }

  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    const expiringWebsites = await prisma.website.findMany({
      where: {
        subscriptionStatus: 'ACTIVE',
        currentPeriodEnd: { lte: now },
        plan: { not: 'FREE' },
      },
      select: { websiteId: true },
    })

    let markedPastDue = 0
    for (const website of expiringWebsites) {
      await prisma.website.update({
        where: { websiteId: website.websiteId },
        data: { subscriptionStatus: 'PAST_DUE' },
      })
      markedPastDue++
    }

    const pastDueWebsites = await prisma.website.findMany({
      where: {
        subscriptionStatus: 'PAST_DUE',
        failedPayments: { gte: 3 },
        plan: { not: 'FREE' },
      },
      select: { websiteId: true },
    })

    let downgraded = 0
    for (const website of pastDueWebsites) {
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
      downgraded++
    }

    return NextResponse.json({
      message: 'Cron job completed',
      results: {
        markedPastDue,
        downgraded,
      },
    })
  } catch (error) {
    console.error('[Cron] Renew subscriptions error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
