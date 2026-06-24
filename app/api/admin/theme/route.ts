import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import {
  DEFAULT_PLATFORM_THEME,
  getPlatformTheme,
  isValidHexColor,
  normalizePlatformTheme,
  resetPlatformTheme,
  updatePlatformTheme,
  type PlatformTheme,
} from '@/lib/platform-theme'

export async function GET() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const theme = await getPlatformTheme()
    return NextResponse.json({ theme, defaults: DEFAULT_PLATFORM_THEME })
  } catch (error) {
    console.error('[Admin Theme] GET error:', error)
    return NextResponse.json({ error: 'Tema yüklenemedi' }, { status: 500 })
  }
}

const colorField = z.string().refine(isValidHexColor, 'Geçersiz renk kodu')

const themeSchema = z.object({
  background: colorField.optional(),
  foreground: colorField.optional(),
  card: colorField.optional(),
  cardForeground: colorField.optional(),
  muted: colorField.optional(),
  mutedForeground: colorField.optional(),
  border: colorField.optional(),
  accent: colorField.optional(),
  accentForeground: colorField.optional(),
})

export async function PATCH(req: Request) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const body = await req.json()
    const parsed = themeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz renk değerleri' }, { status: 400 })
    }

    const theme = await updatePlatformTheme(parsed.data as Partial<PlatformTheme>)
    return NextResponse.json({ theme })
  } catch (error) {
    console.error('[Admin Theme] PATCH error:', error)
    return NextResponse.json({ error: 'Tema kaydedilemedi' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const theme = await resetPlatformTheme()
    return NextResponse.json({ theme })
  } catch (error) {
    console.error('[Admin Theme] DELETE error:', error)
    return NextResponse.json({ error: 'Tema sıfırlanamadı' }, { status: 500 })
  }
}
