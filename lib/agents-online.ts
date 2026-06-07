import { prisma } from './db'
import { getAgentsOnlineCount } from './socket'

const ONLINE_WINDOW_MS = 5 * 60 * 1000

/** Live socket count, with recent dashboard activity as fallback. */
export async function resolveAgentsOnline(
  websitePublicId: string,
  websiteDbId: string
): Promise<number> {
  const socketCount = getAgentsOnlineCount(websitePublicId)
  if (socketCount > 0) return socketCount

  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS)
  try {
    return await prisma.teamMember.count({
      where: {
        websiteId: websiteDbId,
        user: { lastSeenAt: { gte: cutoff } },
      },
    })
  } catch (e) {
    console.warn('[agents-online] fallback 0:', e)
    return 0
  }
}
