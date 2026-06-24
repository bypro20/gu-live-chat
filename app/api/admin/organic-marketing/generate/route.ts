import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { generateOrganicStrategy } from '@/lib/organic-marketing/generator'

/** POST /api/admin/organic-marketing/generate — AI ile strateji üret */
export async function POST(request: NextRequest) {
  const check = await requireAdmin()
  if (check.error) return check.error

  let forceSeed = false
  try {
    const body = (await request.json()) as { forceSeed?: boolean }
    forceSeed = Boolean(body?.forceSeed)
  } catch {
    /* empty body ok */
  }

  try {
    const result = await generateOrganicStrategy({ forceSeed })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[admin/organic-marketing/generate]', error)
    return NextResponse.json({ error: 'Strateji üretilemedi' }, { status: 500 })
  }
}
