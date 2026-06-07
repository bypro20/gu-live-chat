import { prisma } from './db'
import { ensureAdminMarketingAccess } from './marketing-website'

export type AdminInboxSite = {
  id: string
  websiteId: string
  name: string
  domain: string
}

async function findSiteByPublicId(publicId: string): Promise<AdminInboxSite | null> {
  try {
    const site = await prisma.website.findUnique({
      where: { websiteId: publicId },
      select: { id: true, websiteId: true, name: true, domain: true },
    })
    if (site) return site
  } catch (e) {
    console.warn('[admin-inbox-setup] prisma find failed:', e)
  }

  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ id: string; websiteId: string; name: string; domain: string }>
    >(
      `SELECT id, websiteId, name, domain FROM websites WHERE websiteId = ? LIMIT 1`,
      publicId
    )
    return rows[0] ?? null
  } catch (e) {
    console.warn('[admin-inbox-setup] raw find failed:', e)
    return null
  }
}

/** Admin gelen kutusu için site çözümle. Şema sync burada ÇALIŞTIRILMAZ (cron'da yapılır). */
export async function resolveAdminInboxSite(adminUserId: string): Promise<AdminInboxSite> {
  let publicId: string | null = null
  try {
    publicId = await ensureAdminMarketingAccess(adminUserId)
  } catch (e) {
    console.error('[admin-inbox-setup] ensure failed:', e)
  }

  if (publicId) {
    const site = await findSiteByPublicId(publicId)
    if (site) return site
  }

  try {
    const owned = await prisma.website.findFirst({
      where: { ownerId: adminUserId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, websiteId: true, name: true, domain: true },
    })
    if (owned) return owned
  } catch (e) {
    console.warn('[admin-inbox-setup] owned lookup failed:', e)
  }

  try {
    const member = await prisma.teamMember.findFirst({
      where: { userId: adminUserId },
      include: { website: { select: { id: true, websiteId: true, name: true, domain: true } } },
      orderBy: { acceptedAt: 'desc' },
    })
    if (member?.website) return member.website
  } catch (e) {
    console.warn('[admin-inbox-setup] member lookup failed:', e)
  }

  throw new Error('Hiçbir site bulunamadı. Önce seed-admin çalıştırın.')
}
