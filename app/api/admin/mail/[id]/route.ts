import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import {
  getAdminMailMessage,
  updateAdminMailMessage,
  type AdminMailStatus,
} from '@/lib/admin-mail-inbox'

const VALID_STATUS: AdminMailStatus[] = ['unread', 'read', 'archived']

/** GET /api/admin/mail/[id] */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin()
  if (check.error) return check.error

  const { id } = await params
  const message = await getAdminMailMessage(id)
  if (!message) {
    return NextResponse.json({ error: 'Mail bulunamadı' }, { status: 404 })
  }

  if (message.status === 'unread') {
    const updated = await updateAdminMailMessage(id, { status: 'read' })
    return NextResponse.json({ message: updated ?? message })
  }

  return NextResponse.json({ message })
}

/** PATCH /api/admin/mail/[id] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin()
  if (check.error) return check.error

  const { id } = await params

  try {
    const body = (await request.json()) as { status?: AdminMailStatus; starred?: boolean }
    if (body.status && !VALID_STATUS.includes(body.status)) {
      return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 })
    }

    const message = await updateAdminMailMessage(id, body)
    if (!message) {
      return NextResponse.json({ error: 'Mail bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('[admin/mail/id]', error)
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 })
  }
}
