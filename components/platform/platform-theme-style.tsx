import { buildPlatformThemeCss, getPlatformTheme, PLATFORM_THEME_STYLE_ID } from '@/lib/platform-theme'

export async function PlatformThemeStyle() {
  const theme = await getPlatformTheme()
  const css = buildPlatformThemeCss(theme)

  return <style id={PLATFORM_THEME_STYLE_ID} dangerouslySetInnerHTML={{ __html: css }} />
}
