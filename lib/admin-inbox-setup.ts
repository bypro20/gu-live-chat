import { prisma } from './db'
import { marketingDomainVariants } from './site-config'
import { ensureAdminMarketingAccess } from './marketing-website'

export type AdminInboxSite = {
  id: string
  websiteId: string
  name: string
  domain: string
  primaryColor?: string | null
}

async function findSiteByPublicId(publicId: string): Promise<AdminInboxSite | null> {
  try {
    const site = await prisma.website.findUnique({
      where: { websiteId: publicId },
      select: { id: true, websiteId: true, name: true, domain: true, primaryColor: true },
    })
    if (site) return site
  } catch (e) {
    console.warn('[admin-inbox-setup] prisma find failed:', e)
  }

  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ id: string; websiteId: string; name: string; domain: string; primaryColor: string | null }>
    >(
      `SELECT id, websiteId, name, domain, primaryColor FROM websites WHERE websiteId = ? LIMIT 1`,
      publicId
    )
    return rows[0] ?? null
  } catch (e) {
    console.warn('[admin-inbox-setup] raw find failed:', e)
    return null
  }
}

/** AI/KB bootstrap — gelen kutusu UI'ını bloklamaz. */
export function scheduleAdminInboxBootstrap(adminUserId: string): void {
  void ensureAdminMarketingAccess(adminUserId).catch((e) => {
    console.warn('[admin-inbox-setup] background bootstrap:', e)
  })
}

/** Admin gelen kutusu için site — yalnızca hızlı DB sorguları, bootstrap yok. */
export async function resolveAdminInboxSite(adminUserId: string): Promise<AdminInboxSite> {
  const envId =
    process.env.NEXT_PUBLIC_MARKETING_WEBSITE_ID?.trim() ||
    process.env.NEXT_PUBLIC_WIDGET_WEBSITE_ID?.trim()

  if (envId) {
    const site = await findSiteByPublicId(envId)
    if (site) return site
  }

  try {
    const marketing = await prisma.website.findFirst({
      where: { domain: { in: marketingDomainVariants() } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, websiteId: true, name: true, domain: true, primaryColor: true },
    })
    if (marketing) return marketing
  } catch (e) {
    console.warn('[admin-inbox-setup] marketing domain lookup failed:', e)
  }

  try {
    const owned = await prisma.website.findFirst({
      where: { ownerId: adminUserId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, websiteId: true, name: true, domain: true, primaryColor: true },
    })
    if (owned) return owned
  } catch (e) {
    console.warn('[admin-inbox-setup] owned lookup failed:', e)
  }

  try {
    const member = await prisma.teamMember.findFirst({
      where: { userId: adminUserId },
      include: { website: { select: { id: true, websiteId: true, name: true, domain: true, primaryColor: true } } },
      orderBy: { acceptedAt: 'desc' },
    })
    if (member?.website) return member.website
  } catch (e) {
    console.warn('[admin-inbox-setup] member lookup failed:', e)
  }

  throw new Error(
    'Site bulunamadı. MARKETING_WEBSITE_DOMAIN veya NEXT_PUBLIC_MARKETING_WEBSITE_ID ayarlayın veya seed-admin çalıştırın.'
  )
}
