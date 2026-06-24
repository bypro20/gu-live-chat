import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron-auth'
import { runOrganicMarketingBot } from '@/lib/organic-marketing/daily-bot'
import { runPaidMarketingBot } from '@/lib/paid-marketing/daily-bot'

/** GET /api/cron/organic-marketing — organik + ücretli reklam botları */
export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request)
  if (authError) return authError

  try {
    const [organic, paid] = await Promise.all([runOrganicMarketingBot(), runPaidMarketingBot()])
    console.log('[Cron/organic-marketing]', JSON.stringify({ organic, paid }))
    return NextResponse.json({
      message: [organic.summary, paid.summary].filter(Boolean).join(' · ') || 'Marketing bots completed',
      organic,
      paid,
    })
  } catch (error) {
    console.error('[Cron/organic-marketing]', error)
    return NextResponse.json({ error: 'Marketing bot failed' }, { status: 500 })
  }
}
