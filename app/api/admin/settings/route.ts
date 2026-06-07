import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { getPlatformSettings, updatePlatformSettings } from '@/lib/platform-settings'

export async function GET() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const settings = await getPlatformSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('[Admin Settings] GET error:', error)
    return NextResponse.json({ error: 'Ayarlar yüklenemedi' }, { status: 500 })
  }
}

const patchSchema = z.object({
  platformName: z.string().min(2).max(80).optional(),
  supportEmail: z.string().email().optional(),
})

export async function PATCH(req: Request) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 })
    }

    const settings = await updatePlatformSettings(parsed.data)
    return NextResponse.json(settings)
  } catch (error) {
    console.error('[Admin Settings] PATCH error:', error)
    return NextResponse.json({ error: 'Ayarlar kaydedilemedi' }, { status: 500 })
  }
}
