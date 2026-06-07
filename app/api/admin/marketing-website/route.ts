import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { ensureAdminMarketingAccess } from '@/lib/marketing-website'

/** guchat.org widget'ının bağlı olduğu site (admin gelen kutusu). */
export async function GET() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const websiteId = await ensureAdminMarketingAccess(check.user.id)

    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, websiteId: true, name: true, domain: true },
    })

    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(website)
  } catch (error) {
    console.error('Admin marketing-website error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
