import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/cron/data-retention
// autoDelete acik sitelerde eski oturum/pageview verisini temizler
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const providedSecret = authHeader?.replace('Bearer ', '')

  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 })
  }
  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const policies = await prisma.dataRetentionPolicy.findMany({
      where: { autoDelete: true },
      include: { website: { select: { id: true, name: true } } },
    })

    let totalSessions = 0
    let totalPageViews = 0

    for (const policy of policies) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - policy.sessionDataDays)

      const oldSessions = await prisma.visitorSession.findMany({
        where: {
          websiteId: policy.websiteId,
          startedAt: { lt: cutoff },
        },
        select: { id: true },
        take: 500,
      })

      if (oldSessions.length > 0) {
        const ids = oldSessions.map((s) => s.id)
        const pv = await prisma.pageView.deleteMany({
          where: { sessionId: { in: ids } },
        })
        const vs = await prisma.visitorSession.deleteMany({
          where: { id: { in: ids } },
        })
        totalPageViews += pv.count
        totalSessions += vs.count
      }

      await prisma.dataRetentionPolicy.update({
        where: { id: policy.id },
        data: { lastCleanupAt: new Date() },
      })
    }

    return NextResponse.json({
      message: 'Data retention cron completed',
      websites: policies.length,
      deletedSessions: totalSessions,
      deletedPageViews: totalPageViews,
    })
  } catch (error) {
    console.error('[Cron] Data retention error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
