import { NextRequest, NextResponse } from 'next/server'
import { runSeoIndexing } from '@/lib/seo-indexing'

/** GET /api/cron/seo-index — Bing ping + IndexNow (günlük) */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const providedSecret = authHeader?.replace('Bearer ', '')

  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 })
  }
  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runSeoIndexing()
    console.log('[Cron/seo-index]', JSON.stringify(result))
    return NextResponse.json({ message: 'SEO indexing completed', ...result })
  } catch (error) {
    console.error('[Cron/seo-index]', error)
    return NextResponse.json({ error: 'SEO indexing failed' }, { status: 500 })
  }
}
