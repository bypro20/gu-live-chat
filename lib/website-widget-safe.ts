import { prisma } from './db'
import type { Plan } from '@/app/generated/prisma/client'

import { WIDGET_IDENTITY_DEFAULTS } from './widget-platform-defaults'

export type WidgetWebsiteRow = {
  id: string
  websiteId: string
  name: string
  plan: Plan
  primaryColor: string
  position: string
  welcomeMessage: string
  offlineMessage: string
  avatarUrl: string | null
  showPreChatForm: boolean
  requireName: boolean
  requireEmail: boolean
}

const DEFAULTS: Omit<WidgetWebsiteRow, 'id' | 'websiteId' | 'name' | 'plan'> = {
  primaryColor: '#1972F5',
  position: 'BOTTOM_RIGHT',
  welcomeMessage: 'Merhaba! Size nasıl yardımcı olabiliriz?',
  offlineMessage: 'Şu an çevrimdışıyız. Bir mesaj bırakın, size dönelim.',
  avatarUrl: null,
  showPreChatForm: WIDGET_IDENTITY_DEFAULTS.showPreChatForm,
  requireName: WIDGET_IDENTITY_DEFAULTS.requireName,
  requireEmail: WIDGET_IDENTITY_DEFAULTS.requireEmail,
}

function mapRow(row: Record<string, unknown>): WidgetWebsiteRow {
  return {
    id: String(row.id),
    websiteId: String(row.websiteId),
    name: String(row.name ?? 'Website'),
    plan: (String(row.plan ?? 'FREE') as Plan),
    primaryColor: String(row.primaryColor ?? DEFAULTS.primaryColor),
    position: String(row.position ?? DEFAULTS.position),
    welcomeMessage: String(row.welcomeMessage ?? DEFAULTS.welcomeMessage),
    offlineMessage: String(row.offlineMessage ?? DEFAULTS.offlineMessage),
    avatarUrl: row.avatarUrl != null ? String(row.avatarUrl) : null,
    showPreChatForm:
      row.showPreChatForm == null
        ? DEFAULTS.showPreChatForm
        : row.showPreChatForm === 1 || row.showPreChatForm === true,
    requireName:
      row.requireName == null
        ? DEFAULTS.requireName
        : row.requireName === 1 || row.requireName === true,
    requireEmail:
      row.requireEmail == null
        ? DEFAULTS.requireEmail
        : row.requireEmail === 1 || row.requireEmail === true,
  }
}

/** Prod Turso'da eksik kolon olsa bile widget için site bilgisini getirir. */
export async function findWebsiteForWidget(
  publicWebsiteId: string
): Promise<WidgetWebsiteRow | null> {
  try {
    const site = await prisma.website.findUnique({
      where: { websiteId: publicWebsiteId },
      select: {
        id: true,
        websiteId: true,
        name: true,
        plan: true,
        primaryColor: true,
        position: true,
        welcomeMessage: true,
        offlineMessage: true,
        avatarUrl: true,
        showPreChatForm: true,
        requireName: true,
        requireEmail: true,
      },
    })
    if (site) return site as WidgetWebsiteRow
  } catch (e) {
    console.warn('[website-widget-safe] prisma select failed:', e)
  }

  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<Record<string, unknown>>
    >(
      `SELECT id, websiteId, name, plan, primaryColor, position, welcomeMessage, offlineMessage
       FROM websites WHERE websiteId = ? LIMIT 1`,
      publicWebsiteId
    )
    if (rows?.[0]) return mapRow(rows[0])
  } catch (e) {
    console.warn('[website-widget-safe] raw minimal failed:', e)
  }

  return null
}
