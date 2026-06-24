import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { countUnreadAdminMail } from '@/lib/admin-mail-inbox'

/** GET /api/admin/mail/unread-count */
export async function GET() {
  const check = await requireAdmin()
  if (check.error) return check.error

  const unreadCount = await countUnreadAdminMail()
  return NextResponse.json({ unreadCount })
}
