import { prisma } from '@/lib/db'
import {
  DEFAULT_PLATFORM_THEMES,
  normalizePanelTheme,
  normalizePlatformThemes,
  PLATFORM_THEME_KEY,
  type PanelTheme,
  type PlatformThemes,
} from '@/lib/platform-theme'

export async function getPlatformTheme(): Promise<PlatformThemes> {
  try {
    const row = await prisma.platformSetting.findUnique({
      where: { key: PLATFORM_THEME_KEY },
    })
    if (!row?.value) return { ...DEFAULT_PLATFORM_THEMES }
    return normalizePlatformThemes(JSON.parse(row.value))
  } catch {
    return { ...DEFAULT_PLATFORM_THEMES }
  }
}

export type PlatformThemeUpdate = {
  admin?: Partial<PanelTheme>
  adminDark?: Partial<PanelTheme>
  customer?: Partial<PanelTheme>
  customerDark?: Partial<PanelTheme>
}

export async function updatePlatformTheme(input: PlatformThemeUpdate): Promise<PlatformThemes> {
  const current = await getPlatformTheme()
  const next: PlatformThemes = {
    admin: input.admin
      ? normalizePanelTheme({ ...current.admin, ...input.admin }, current.admin)
      : current.admin,
    adminDark: input.adminDark
      ? normalizePanelTheme({ ...current.adminDark, ...input.adminDark }, current.adminDark)
      : current.adminDark,
    customer: input.customer
      ? normalizePanelTheme({ ...current.customer, ...input.customer }, current.customer)
      : current.customer,
    customerDark: input.customerDark
      ? normalizePanelTheme({ ...current.customerDark, ...input.customerDark }, current.customerDark)
      : current.customerDark,
  }

  await prisma.platformSetting.upsert({
    where: { key: PLATFORM_THEME_KEY },
    create: { key: PLATFORM_THEME_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  })

  return next
}

export async function resetPlatformTheme(): Promise<PlatformThemes> {
  await prisma.platformSetting.deleteMany({ where: { key: PLATFORM_THEME_KEY } })
  return { ...DEFAULT_PLATFORM_THEMES }
}
