import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getPaidMarketingHealth, testPaidMarketingEmail } from '@/lib/marketing-health'

/** GET — ücretli reklam e-posta durumu */
export async function GET() {
  const check = await requireAdmin()
  if (check.error) return check.error

  try {
    const health = await getPaidMarketingHealth()
    return NextResponse.json({ health })
  } catch (error) {
    console.error('[admin/paid-marketing/health]', error)
    return NextResponse.json({ error: 'Durum okunamadı' }, { status: 500 })
  }
}

/** POST — günlük özet test e-postası */
export async function POST() {
  const check = await requireAdmin()
  if (check.error) return check.error

  try {
    const test = await testPaidMarketingEmail()
    const health = await getPaidMarketingHealth()
    return NextResponse.json({ test, health })
  } catch (error) {
    console.error('[admin/paid-marketing/health/test]', error)
    return NextResponse.json({ error: 'Test gönderilemedi' }, { status: 500 })
  }
}
