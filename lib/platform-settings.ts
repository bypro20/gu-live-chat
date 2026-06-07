import { prisma } from '@/lib/db'

export type PlatformSettings = {
  platformName: string
  supportEmail: string
}

const DEFAULTS: PlatformSettings = {
  platformName: process.env.PLATFORM_NAME || 'Gu Chat',
  supportEmail: process.env.SUPPORT_EMAIL || 'destek@guchat.org',
}

const KEYS = {
  platformName: 'platform_name',
  supportEmail: 'support_email',
} as const

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const rows = await prisma.platformSetting.findMany({
      where: { key: { in: Object.values(KEYS) } },
    })
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))
    return {
      platformName: map[KEYS.platformName] || DEFAULTS.platformName,
      supportEmail: map[KEYS.supportEmail] || DEFAULTS.supportEmail,
    }
  } catch {
    return DEFAULTS
  }
}

export async function updatePlatformSettings(
  input: Partial<PlatformSettings>
): Promise<PlatformSettings> {
  const updates: Array<{ key: string; value: string }> = []
  if (input.platformName?.trim()) {
    updates.push({ key: KEYS.platformName, value: input.platformName.trim() })
  }
  if (input.supportEmail?.trim()) {
    updates.push({ key: KEYS.supportEmail, value: input.supportEmail.trim() })
  }

  for (const u of updates) {
    await prisma.platformSetting.upsert({
      where: { key: u.key },
      create: { key: u.key, value: u.value },
      update: { value: u.value },
    })
  }

  return getPlatformSettings()
}
