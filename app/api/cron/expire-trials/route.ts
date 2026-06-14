import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron-auth'
import { checkAndExpireTrials } from '@/lib/trial'

// GET /api/cron/expire-trials
// Called by Vercel Cron daily at 03:00 UTC
// Downgrades any TRIALING websites whose trialEndsAt has passed
export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request)
  if (authError) return authError

  try {
    const expired = await checkAndExpireTrials()
    console.log(`[Cron] Expired ${expired} trial(s)`)
    return NextResponse.json({ message: 'Trial expiry cron completed', expired })
  } catch (error) {
    console.error('[Cron] Expire trials error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
