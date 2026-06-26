import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  deleteConversationsByIds,
  filterAccessibleConversationIds,
} from '@/lib/inbox-delete'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === 'string') : []
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Silinecek sohbet seçilmedi' }, { status: 400 })
    }
    if (ids.length > 100) {
      return NextResponse.json({ error: 'En fazla 100 sohbet silinebilir' }, { status: 400 })
    }

    const allowed = await filterAccessibleConversationIds(session.user.id, ids)
    if (allowed.length === 0) {
      return NextResponse.json({ error: 'Silinecek sohbet bulunamadı' }, { status: 404 })
    }

    const deleted = await deleteConversationsByIds(allowed)
    return NextResponse.json({ deleted, ok: true })
  } catch (error) {
    console.error('[Bulk delete conversations] error:', error)
    return NextResponse.json({ error: 'Sohbetler silinemedi' }, { status: 500 })
  }
}
