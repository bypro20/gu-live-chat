import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { resolveAdminInboxSite } from '@/lib/admin-inbox-setup'

/** Admin gelen kutusu okunmamış mesaj sayısı (sidebar badge). */
export async function GET() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const site = await resolveAdminInboxSite(check.user.id)

    const rows = await prisma.conversation.aggregate({
      where: { websiteId: site.id },
      _sum: { unreadCount: true },
    })
    const unreadCount = rows._sum.unreadCount ?? 0

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error('Admin inbox-unread error:', error)
    return NextResponse.json({ unreadCount: 0 })
  }
}
