import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { fetchPlatformIntelligence } from '@/lib/admin-platform-intel'

export async function GET() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const data = await fetchPlatformIntelligence()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Platform intelligence error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
