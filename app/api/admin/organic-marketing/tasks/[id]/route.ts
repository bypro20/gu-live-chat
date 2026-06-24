import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { updateContentTask } from '@/lib/organic-marketing/storage'
import type { ContentTaskStatus } from '@/lib/organic-marketing/types'

const VALID_STATUS: ContentTaskStatus[] = ['draft', 'approved', 'published', 'skipped']

/** PATCH /api/admin/organic-marketing/tasks/[id] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin()
  if (check.error) return check.error

  const { id } = await params

  try {
    const body = (await request.json()) as {
      status?: ContentTaskStatus
      title?: string
      hook?: string
      body?: string
      cta?: string
    }

    if (body.status && !VALID_STATUS.includes(body.status)) {
      return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 })
    }

    const task = await updateContentTask(id, body)
    if (!task) {
      return NextResponse.json({ error: 'Görev bulunamadı' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('[admin/organic-marketing/tasks]', error)
    return NextResponse.json({ error: 'Güncellenemedi' }, { status: 500 })
  }
}
