import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { fetchAdminWebsitesRich } from '@/lib/admin-platform-intel'

export async function GET() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const websites = await fetchAdminWebsitesRich()
    return NextResponse.json(websites)
  } catch (error) {
    console.error('Admin websites error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
