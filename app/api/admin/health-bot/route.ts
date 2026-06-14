import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { loadBotReport, runSiteHealthBot } from '@/lib/site-health-bot'

/** GET — son bot raporu. POST — manuel tetikleme (ADMIN). */
export async function GET() {
  const admin = await requireAdmin()
  if ('error' in admin) return admin.error

  const report = await loadBotReport()
  return NextResponse.json({ report })
}

export async function POST() {
  const admin = await requireAdmin()
  if ('error' in admin) return admin.error

  const report = await runSiteHealthBot()
  return NextResponse.json(report, { status: report.ok ? 200 : 503 })
}
