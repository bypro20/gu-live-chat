import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { resolveAdminInboxSite } from '@/lib/admin-inbox-setup'

/** gulivechat.com widget'ının bağlı olduğu site (admin gelen kutusu). */
export async function GET() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const website = await resolveAdminInboxSite(check.user.id)
    return NextResponse.json(website)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error('Admin marketing-website error:', error)
    return NextResponse.json(
      {
        error: 'Marketing sitesi kurulamadı. Deploy sonrası seed-admin çalıştırın.',
        detail: detail.slice(0, 200),
      },
      { status: 500 }
    )
  }
}
