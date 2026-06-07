import { NextRequest, NextResponse } from 'next/server'
import { runSiteHealthBot } from '@/lib/site-health-bot'

/** GET /api/cron/site-health-bot — Otomatik site kontrolü + güvenli onarım (CRON_SECRET). */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const providedSecret = authHeader?.replace('Bearer ', '')

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const report = await runSiteHealthBot()
    return NextResponse.json(report, { status: report.ok ? 200 : 503 })
  } catch (error) {
    console.error('[Cron] site-health-bot error:', error)
    return NextResponse.json({ error: 'Health bot failed' }, { status: 500 })
  }
}
