import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron-auth'
import { syncProductionSchema } from '@/lib/db-schema-sync'

/** GET /api/cron/schema-sync — Prod DB şema güncellemesi (CRON_SECRET gerekli). */
export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request)
  if (authError) return authError

  try {
    const result = await syncProductionSchema()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[Cron] schema-sync error:', error)
    return NextResponse.json({ error: 'Schema sync failed' }, { status: 500 })
  }
}
