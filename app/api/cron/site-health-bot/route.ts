import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron-auth'
import { runSiteHealthBot } from '@/lib/site-health-bot'

/** GET /api/cron/site-health-bot — Otomatik site kontrolü + güvenli onarım (CRON_SECRET). */
export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request)
  if (authError) return authError

  try {
    const report = await runSiteHealthBot()
    return NextResponse.json(report, { status: report.ok ? 200 : 503 })
  } catch (error) {
    console.error('[Cron] site-health-bot error:', error)
    return NextResponse.json({ error: 'Health bot failed' }, { status: 500 })
  }
}
