import { prisma } from './db'
import { syncProductionSchema } from './db-schema-sync'
import { ensureAdminMarketingAccess } from './marketing-website'

export type AdminInboxSite = {
  id: string
  websiteId: string
  name: string
  domain: string
}

/** Admin gelen kutusu için site çözümle — asla boş dönmez (mümkün olduğunca). */
export async function resolveAdminInboxSite(adminUserId: string): Promise<AdminInboxSite> {
  await syncProductionSchema().catch((e) => console.warn('[admin-inbox-setup] schema:', e))

  let publicId: string | null = null
  try {
    publicId = await ensureAdminMarketingAccess(adminUserId)
  } catch (e) {
    console.error('[admin-inbox-setup] ensure failed:', e)
  }

  if (publicId) {
    const site = await prisma.website.findUnique({
      where: { websiteId: publicId },
      select: { id: true, websiteId: true, name: true, domain: true },
    })
    if (site) return site
  }

  const owned = await prisma.website.findFirst({
    where: { ownerId: adminUserId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, websiteId: true, name: true, domain: true },
  })
  if (owned) return owned

  const member = await prisma.teamMember.findFirst({
    where: { userId: adminUserId },
    include: { website: { select: { id: true, websiteId: true, name: true, domain: true } } },
    orderBy: { acceptedAt: 'desc' },
  })
  if (member?.website) return member.website

  throw new Error('Hiçbir site bulunamadı. Önce seed-admin çalıştırın.')
}
