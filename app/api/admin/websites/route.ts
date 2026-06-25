import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import {
  fetchAdminWebsiteDetail,
  fetchAdminWebsiteOptions,
  fetchAdminWebsitesPage,
} from '@/lib/admin-platform-intel'

export async function GET(req: NextRequest) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const { searchParams } = new URL(req.url)

    if (searchParams.get('options') === '1') {
      const items = await fetchAdminWebsiteOptions(
        Number.parseInt(searchParams.get('limit') || '500', 10) || 500,
      )
      return NextResponse.json({ items })
    }

    const page = Number.parseInt(searchParams.get('page') || '1', 10) || 1
    const pageSize = Number.parseInt(searchParams.get('pageSize') || '25', 10) || 25
    const search = searchParams.get('search')?.trim() || undefined
    const widgetStatus = searchParams.get('widgetStatus') || undefined
    const detailId = searchParams.get('detail')?.trim()

    if (detailId) {
      const detail = await fetchAdminWebsiteDetail(detailId)
      if (!detail) {
        return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
      }
      return NextResponse.json(detail)
    }

    const result = await fetchAdminWebsitesPage({
      page,
      pageSize,
      search,
      widgetStatus,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Admin websites error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
