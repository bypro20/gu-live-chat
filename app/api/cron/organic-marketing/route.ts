import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron-auth'
import { runOrganicMarketingBot } from '@/lib/organic-marketing/daily-bot'

/** GET /api/cron/organic-marketing — günlük içerik görevi botu */
export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request)
  if (authError) return authError

  try {
    const result = await runOrganicMarketingBot()
    console.log('[Cron/organic-marketing]', JSON.stringify(result))
    return NextResponse.json({
      message: result.summary || 'Organic marketing bot completed',
      ...result,
    })
  } catch (error) {
    console.error('[Cron/organic-marketing]', error)
    return NextResponse.json({ error: 'Organic marketing bot failed' }, { status: 500 })
  }
}
