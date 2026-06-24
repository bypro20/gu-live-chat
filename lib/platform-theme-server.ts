import { prisma } from '@/lib/db'
import {
  DEFAULT_PLATFORM_THEME,
  normalizePlatformTheme,
  PLATFORM_THEME_KEY,
  type PlatformTheme,
} from '@/lib/platform-theme'

export async function getPlatformTheme(): Promise<PlatformTheme> {
  try {
    const row = await prisma.platformSetting.findUnique({
      where: { key: PLATFORM_THEME_KEY },
    })
    if (!row?.value) return DEFAULT_PLATFORM_THEME
    return normalizePlatformTheme(JSON.parse(row.value) as Partial<PlatformTheme>)
  } catch {
    return DEFAULT_PLATFORM_THEME
  }
}

export async function updatePlatformTheme(input: Partial<PlatformTheme>): Promise<PlatformTheme> {
  const current = await getPlatformTheme()
  const next = normalizePlatformTheme({ ...current, ...input })

  await prisma.platformSetting.upsert({
    where: { key: PLATFORM_THEME_KEY },
    create: { key: PLATFORM_THEME_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  })

  return next
}

export async function resetPlatformTheme(): Promise<PlatformTheme> {
  await prisma.platformSetting.deleteMany({ where: { key: PLATFORM_THEME_KEY } })
  return DEFAULT_PLATFORM_THEME
}
