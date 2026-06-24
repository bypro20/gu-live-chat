import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { isPaidAiAvailable } from '@/lib/paid-marketing/generator'
import { ensurePaidPlanInitialized } from '@/lib/paid-marketing/storage'

/** GET /api/admin/paid-marketing */
export async function GET() {
  const check = await requireAdmin()
  if (check.error) return check.error

  try {
    const plan = await ensurePaidPlanInitialized()
    return NextResponse.json({
      plan,
      aiAvailable: isPaidAiAvailable(),
    })
  } catch (error) {
    console.error('[admin/paid-marketing]', error)
    return NextResponse.json({ error: 'Plan yüklenemedi' }, { status: 500 })
  }
}
