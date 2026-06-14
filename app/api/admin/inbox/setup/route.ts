import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { resolveAdminInboxSite } from '@/lib/admin-inbox-setup'

/** GET /api/admin/inbox/setup — Gelen kutusu sitesini kur/getir. */
export async function GET() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const site = await resolveAdminInboxSite(check.user.id)
    return NextResponse.json(site)
  } catch (error) {
    console.error('[Admin inbox setup] error:', error)
    return NextResponse.json(
      {
        error: 'Gelen kutusu kurulamadı',
      },
      { status: 500 }
    )
  }
}
