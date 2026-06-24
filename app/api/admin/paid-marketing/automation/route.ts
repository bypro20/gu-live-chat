import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import {
  getPaidAutomationConfig,
  savePaidAutomationConfig,
  type PaidAutomationConfig,
} from '@/lib/paid-marketing/automation-config'

/** GET /api/admin/paid-marketing/automation */
export async function GET() {
  const check = await requireAdmin()
  if (check.error) return check.error

  const config = await getPaidAutomationConfig()
  return NextResponse.json({ config })
}

/** PATCH /api/admin/paid-marketing/automation */
export async function PATCH(request: NextRequest) {
  const check = await requireAdmin()
  if (check.error) return check.error

  try {
    const body = (await request.json()) as Partial<PaidAutomationConfig>
    const patch: Partial<PaidAutomationConfig> = {}

    if (typeof body.enabled === 'boolean') patch.enabled = body.enabled
    if (typeof body.dailyEmailDigest === 'boolean') patch.dailyEmailDigest = body.dailyEmailDigest
    if (typeof body.rotateChannels === 'boolean') patch.rotateChannels = body.rotateChannels
    if (typeof body.notifyEmail === 'string') patch.notifyEmail = body.notifyEmail.trim()

    const config = await savePaidAutomationConfig(patch)
    return NextResponse.json({ config })
  } catch (error) {
    console.error('[admin/paid-marketing/automation]', error)
    return NextResponse.json({ error: 'Kaydedilemedi' }, { status: 500 })
  }
}

/** POST — manuel bot çalıştır */
export async function POST() {
  const check = await requireAdmin()
  if (check.error) return check.error

  try {
    const { runPaidMarketingAutomation } = await import('@/lib/paid-marketing/auto-runner')
    const report = await runPaidMarketingAutomation()
    return NextResponse.json({ report })
  } catch (error) {
    console.error('[admin/paid-marketing/automation/run]', error)
    return NextResponse.json({ error: 'Çalıştırılamadı' }, { status: 500 })
  }
}
