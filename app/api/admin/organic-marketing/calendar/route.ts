import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { regenerateWeekCalendar } from '@/lib/organic-marketing/generator'

/** POST /api/admin/organic-marketing/calendar — 7 günlük takvim yenile */
export async function POST() {
  const check = await requireAdmin()
  if (check.error) return check.error

  try {
    const plan = await regenerateWeekCalendar()
    return NextResponse.json({ plan, message: 'Haftalık takvim güncellendi.' })
  } catch (error) {
    console.error('[admin/organic-marketing/calendar]', error)
    return NextResponse.json({ error: 'Takvim üretilemedi' }, { status: 500 })
  }
}
