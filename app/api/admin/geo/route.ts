import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { lookupIpGeo } from '@/lib/geo'

export async function GET(req: NextRequest) {
  const check = await requireAdmin()
  if ('error' in check) return check.error

  const ip = new URL(req.url).searchParams.get('ip')
  if (!ip) {
    return NextResponse.json({ error: 'IP adresi gerekli' }, { status: 400 })
  }

  const geo = await lookupIpGeo(ip)
  if (!geo) {
    return NextResponse.json({ error: 'Konum bilgisi alınamadı' }, { status: 404 })
  }

  return NextResponse.json(geo)
}
