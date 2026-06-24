import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getOrganicMarketingHealth, testOrganicMarketingDelivery } from '@/lib/marketing-health'

/** GET — organik pazarlama webhook/e-posta durumu */
export async function GET() {
  const check = await requireAdmin()
  if (check.error) return check.error

  try {
    const health = await getOrganicMarketingHealth()
    return NextResponse.json({ health })
  } catch (error) {
    console.error('[admin/organic-marketing/health]', error)
    return NextResponse.json({ error: 'Durum okunamadı' }, { status: 500 })
  }
}

/** POST — test gönderimi (webhook + E-posta Merkezi) */
export async function POST() {
  const check = await requireAdmin()
  if (check.error) return check.error

  try {
    const test = await testOrganicMarketingDelivery()
    const health = await getOrganicMarketingHealth()
    return NextResponse.json({ test, health })
  } catch (error) {
    console.error('[admin/organic-marketing/health/test]', error)
    return NextResponse.json({ error: 'Test gönderilemedi' }, { status: 500 })
  }
}
