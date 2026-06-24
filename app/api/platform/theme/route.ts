import { NextResponse } from 'next/server'
import { buildPlatformThemeCss } from '@/lib/platform-theme'
import { getPlatformTheme } from '@/lib/platform-theme-server'

export async function GET() {
  try {
    const themes = await getPlatformTheme()
    return NextResponse.json(
      { themes, css: buildPlatformThemeCss(themes) },
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
