import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron-auth'
import { runSeoIndexing } from '@/lib/seo-indexing'

/** GET /api/cron/seo-index — Bing ping + IndexNow (günlük) */
export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request)
  if (authError) return authError

  try {
    const result = await runSeoIndexing()
    console.log('[Cron/seo-index]', JSON.stringify(result))
    return NextResponse.json({ message: 'SEO indexing completed', ...result })
  } catch (error) {
    console.error('[Cron/seo-index]', error)
    return NextResponse.json({ error: 'SEO indexing failed' }, { status: 500 })
  }
}
