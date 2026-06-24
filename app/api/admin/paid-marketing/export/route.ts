import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { exportGoogleAdsKeywordsCsv } from '@/lib/paid-marketing/format'
import { ensurePaidPlanInitialized } from '@/lib/paid-marketing/storage'

/** GET /api/admin/paid-marketing/export?format=google-keywords */
export async function GET(request: NextRequest) {
  const check = await requireAdmin()
  if (check.error) return check.error

  const format = request.nextUrl.searchParams.get('format')
  const plan = await ensurePaidPlanInitialized()

  if (format === 'google-keywords') {
    const csv = exportGoogleAdsKeywordsCsv(plan.calendar)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="gulivechat-google-ads-keywords.csv"',
      },
    })
  }

  return NextResponse.json({ error: 'Geçersiz format' }, { status: 400 })
}
