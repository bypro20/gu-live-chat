import { prisma } from './db'

/**
 * Resolve a website by EITHER its public `websiteId` or its internal database `id`.
 *
 * The dashboard historically sends both identifiers depending on the page
 * (`activeWebsite.websiteId` vs `activeWebsite.id`). Accepting either keeps every
 * API route working regardless of which one the caller provides.
 */
export async function resolveWebsite(idOrPublicId: string | null | undefined) {
  if (!idOrPublicId) return null
  return prisma.website.findFirst({
    where: { OR: [{ websiteId: idOrPublicId }, { id: idOrPublicId }] },
    select: { id: true, websiteId: true, plan: true, ownerId: true },
  })
}
