import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { resolveAdminInboxSite } from '@/lib/admin-inbox-setup'
import {
  deleteConversationsByIds,
  filterAdminInboxConversationIds,
} from '@/lib/inbox-delete'

export async function POST(req: Request) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const site = await resolveAdminInboxSite(check.user.id)
    const body = await req.json().catch(() => ({}))
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === 'string') : []
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Silinecek sohbet seçilmedi' }, { status: 400 })
    }
    if (ids.length > 100) {
      return NextResponse.json({ error: 'En fazla 100 sohbet silinebilir' }, { status: 400 })
    }

    const allowed = await filterAdminInboxConversationIds(site.id, ids)
    if (allowed.length === 0) {
      return NextResponse.json({ error: 'Silinecek sohbet bulunamadı' }, { status: 404 })
    }

    const deleted = await deleteConversationsByIds(allowed)
    return NextResponse.json({ deleted, ok: true })
  } catch (error) {
    console.error('[Admin bulk delete conversations] error:', error)
    return NextResponse.json({ error: 'Sohbetler silinemedi' }, { status: 500 })
  }
}
