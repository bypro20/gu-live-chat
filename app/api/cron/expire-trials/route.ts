import { NextRequest, NextResponse } from 'next/server'
import { checkAndExpireTrials } from '@/lib/trial'

// GET /api/cron/expire-trials
// Called by Vercel Cron daily at 03:00 UTC
// Downgrades any TRIALING websites whose trialEndsAt has passed
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const providedSecret = authHeader?.replace('Bearer ', '')

  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const expired = await checkAndExpireTrials()
    console.log(`[Cron] Expired ${expired} trial(s)`)
    return NextResponse.json({ message: 'Trial expiry cron completed', expired })
  } catch (error) {
    console.error('[Cron] Expire trials error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
