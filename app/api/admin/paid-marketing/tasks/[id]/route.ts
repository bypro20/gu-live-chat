import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { updateAdTask } from '@/lib/paid-marketing/storage'
import type { AdTaskStatus } from '@/lib/paid-marketing/types'

/** PATCH /api/admin/paid-marketing/tasks/[id] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin()
  if (check.error) return check.error

  const { id } = await params
  try {
    const body = (await request.json()) as { status?: AdTaskStatus }
    const plan = await updateAdTask(id, { status: body.status })
    if (!plan) return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 })
    return NextResponse.json({ plan })
  } catch (error) {
    console.error('[admin/paid-marketing/tasks]', error)
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 })
  }
}
