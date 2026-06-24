import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import {
  DEFAULT_PLATFORM_THEMES,
  isValidHexColor,
  type PanelTheme,
} from '@/lib/platform-theme'
import {
  getPlatformTheme,
  resetPlatformTheme,
  updatePlatformTheme,
} from '@/lib/platform-theme-server'

export async function GET() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const themes = await getPlatformTheme()
    return NextResponse.json({ themes, defaults: DEFAULT_PLATFORM_THEMES })
  } catch (error) {
    console.error('[Admin Theme] GET error:', error)
    return NextResponse.json({ error: 'Tema yüklenemedi' }, { status: 500 })
  }
}

const colorField = z.string().refine(isValidHexColor, 'Geçersiz renk kodu')

const panelSchema = z.object({
  background: colorField.optional(),
  foreground: colorField.optional(),
  card: colorField.optional(),
  cardForeground: colorField.optional(),
  muted: colorField.optional(),
  mutedForeground: colorField.optional(),
  border: colorField.optional(),
  accent: colorField.optional(),
  accentForeground: colorField.optional(),
  hover: colorField.optional(),
})

const patchSchema = z.object({
  admin: panelSchema.optional(),
  adminDark: panelSchema.optional(),
  customer: panelSchema.optional(),
  customerDark: panelSchema.optional(),
})

export async function PATCH(req: Request) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz renk değerleri' }, { status: 400 })
    }

    const themes = await updatePlatformTheme(
      parsed.data as {
        admin?: Partial<PanelTheme>
        adminDark?: Partial<PanelTheme>
        customer?: Partial<PanelTheme>
        customerDark?: Partial<PanelTheme>
      },
    )
    return NextResponse.json({ themes })
  } catch (error) {
    console.error('[Admin Theme] PATCH error:', error)
    return NextResponse.json({ error: 'Tema kaydedilemedi' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const themes = await resetPlatformTheme()
    return NextResponse.json({ themes })
  } catch (error) {
    console.error('[Admin Theme] DELETE error:', error)
    return NextResponse.json({ error: 'Tema sıfırlanamadı' }, { status: 500 })
  }
}
