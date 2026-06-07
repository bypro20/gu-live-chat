import { NextRequest, NextResponse } from 'next/server'
import { syncProductionSchema } from '@/lib/db-schema-sync'

/** GET /api/cron/schema-sync — Prod DB şema güncellemesi (CRON_SECRET gerekli). */
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
    const result = await syncProductionSchema()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[Cron] schema-sync error:', error)
    return NextResponse.json({ error: 'Schema sync failed' }, { status: 500 })
  }
}
