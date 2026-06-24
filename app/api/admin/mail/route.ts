import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { listAdminMailMessages, type AdminMailSource, type AdminMailStatus } from '@/lib/admin-mail-inbox'

/** GET /api/admin/mail */
export async function GET(request: NextRequest) {
  const check = await requireAdmin()
  if (check.error) return check.error

  const sp = request.nextUrl.searchParams
  const status = (sp.get('status') || 'all') as AdminMailStatus | 'all'
  const source = (sp.get('source') || 'all') as AdminMailSource | 'all'
  const q = sp.get('q') || undefined

  try {
    const messages = await listAdminMailMessages({ status, source, q })
    const unreadCount = messages.filter((m) => m.status === 'unread').length
    return NextResponse.json({ messages, unreadCount })
  } catch (error) {
    console.error('[admin/mail]', error)
    return NextResponse.json({ error: 'Mailler yüklenemedi' }, { status: 500 })
  }
}
