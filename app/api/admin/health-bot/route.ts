import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { loadBotReport, runSiteHealthBot } from '@/lib/site-health-bot'

/** GET — son bot raporu. POST — manuel tetikleme (ADMIN). */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const report = await loadBotReport()
  return NextResponse.json({ report })
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const report = await runSiteHealthBot()
  return NextResponse.json(report, { status: report.ok ? 200 : 503 })
}
