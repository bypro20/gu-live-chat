import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { generatePaidMarketingPlan } from '@/lib/paid-marketing/generator'

/** POST /api/admin/paid-marketing/generate */
export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if (check.error) return check.error

  try {
    const body = (await request.json().catch(() => ({}))) as { forceSeed?: boolean }
    const plan = await generatePaidMarketingPlan(Boolean(body.forceSeed))
    return NextResponse.json({
      plan,
      message: body.forceSeed ? 'Hazır reklam planı yüklendi' : 'Reklam planı üretildi',
    })
  } catch (error) {
    console.error('[admin/paid-marketing/generate]', error)
    return NextResponse.json({ error: 'Üretilemedi' }, { status: 500 })
  }
}
