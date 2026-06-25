import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { resolveAdminInboxSite, scheduleAdminInboxBootstrap } from '@/lib/admin-inbox-setup'

/** GET /api/admin/inbox/setup — Gelen kutusu sitesini kur/getir. */
export async function GET() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    scheduleAdminInboxBootstrap(check.user.id)

    const site = await resolveAdminInboxSite(check.user.id)
    return NextResponse.json(site)
  } catch (error) {
    console.error('[Admin inbox setup] error:', error)
    const message = error instanceof Error ? error.message : 'Gelen kutusu kurulamadı'
    return NextResponse.json(
      {
        error: 'Gelen kutusu kurulamadı',
        detail: message,
        hint: 'Admin panel → Ayarlar veya cron/seed-admin ile marketing sitesini oluşturun.',
      },
      { status: 500 }
    )
  }
}
