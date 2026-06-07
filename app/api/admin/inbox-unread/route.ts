import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { ensureAdminMarketingAccess } from '@/lib/marketing-website'

/** Admin gelen kutusu okunmamış mesaj sayısı (sidebar badge). */
export async function GET() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const publicWebsiteId = await ensureAdminMarketingAccess(check.user.id)

    const website = await prisma.website.findUnique({
      where: { websiteId: publicWebsiteId },
      select: { id: true },
    })
    if (!website) {
      return NextResponse.json({ unreadCount: 0 })
    }

    const rows = await prisma.conversation.aggregate({
      where: { websiteId: website.id },
      _sum: { unreadCount: true },
    })
    const unreadCount = rows._sum.unreadCount ?? 0

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('Admin inbox-unread error:', error)
    return NextResponse.json({ unreadCount: 0 })
  }
}
