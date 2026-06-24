import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { ensureOrganicPlanInitialized } from '@/lib/organic-marketing/storage'
import { isOrganicAiAvailable } from '@/lib/organic-marketing/ai'

/** GET /api/admin/organic-marketing — mevcut plan */
export async function GET() {
  const check = await requireAdmin()
  if (check.error) return check.error

  try {
    const plan = await ensureOrganicPlanInitialized()
    return NextResponse.json({
      plan,
      aiAvailable: isOrganicAiAvailable(),
    })
  } catch (error) {
    console.error('[admin/organic-marketing]', error)
    return NextResponse.json({ error: 'Plan yüklenemedi' }, { status: 500 })
  }
}
