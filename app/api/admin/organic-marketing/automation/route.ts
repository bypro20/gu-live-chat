import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import {
  getOrganicAutomationConfig,
  saveOrganicAutomationConfig,
  type OrganicAutomationConfig,
} from '@/lib/organic-marketing/automation-config'

/** GET /api/admin/organic-marketing/automation */
export async function GET() {
  const check = await requireAdmin()
  if (check.error) return check.error

  const config = await getOrganicAutomationConfig()
  return NextResponse.json({ config })
}

/** PATCH /api/admin/organic-marketing/automation */
export async function PATCH(request: NextRequest) {
  const check = await requireAdmin()
  if (check.error) return check.error

  try {
    const body = (await request.json()) as Partial<OrganicAutomationConfig>
    const patch: Partial<OrganicAutomationConfig> = {}

    if (typeof body.enabled === 'boolean') patch.enabled = body.enabled
    if (typeof body.autoPublishBlog === 'boolean') patch.autoPublishBlog = body.autoPublishBlog
    if (typeof body.autoDispatchSocial === 'boolean') patch.autoDispatchSocial = body.autoDispatchSocial
    if (typeof body.blogIntervalDays === 'number' && body.blogIntervalDays >= 1 && body.blogIntervalDays <= 14) {
      patch.blogIntervalDays = body.blogIntervalDays
    }
    if (typeof body.webhookUrl === 'string') patch.webhookUrl = body.webhookUrl.trim()
    if (typeof body.notifyEmail === 'string') patch.notifyEmail = body.notifyEmail.trim()

    const config = await saveOrganicAutomationConfig(patch)
    return NextResponse.json({ config })
  } catch (error) {
    console.error('[admin/organic-marketing/automation]', error)
    return NextResponse.json({ error: 'Kaydedilemedi' }, { status: 500 })
  }
}

/** POST — manuel tetikleme */
export async function POST() {
  const check = await requireAdmin()
  if (check.error) return check.error

  try {
    const { runOrganicMarketingAutomation } = await import('@/lib/organic-marketing/auto-runner')
    const report = await runOrganicMarketingAutomation()
    return NextResponse.json({ report })
  } catch (error) {
    console.error('[admin/organic-marketing/automation/run]', error)
    return NextResponse.json({ error: 'Çalıştırılamadı' }, { status: 500 })
  }
}
