import { NextResponse } from 'next/server'
import { buildPlatformThemeCss, getPlatformTheme } from '@/lib/platform-theme'

export async function GET() {
  try {
    const theme = await getPlatformTheme()
    return NextResponse.json(
      { theme, css: buildPlatformThemeCss(theme) },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    )
  } catch (error) {
    console.error('[Platform Theme] GET error:', error)
    return NextResponse.json({ error: 'Tema yüklenemedi' }, { status: 500 })
  }
}
