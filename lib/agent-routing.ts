import { prisma } from './db'

const ONLINE_WINDOW_MS = 5 * 60 * 1000

/** En az yüklü çevrimiçi temsilciye ata; yoksa sahibine düş. */
export async function assignToBestAgent(
  websiteDbId: string,
  conversationId: string
): Promise<string | null> {
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS)

  const online = await prisma.teamMember.findMany({
    where: {
      websiteId: websiteDbId,
      role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
      user: { lastSeenAt: { gte: cutoff } },
    },
    select: { userId: true },
  })

  let candidates = online.map((m) => m.userId)

  if (candidates.length === 0) {
    const owner = await prisma.teamMember.findFirst({
      where: { websiteId: websiteDbId, role: 'OWNER' },
      select: { userId: true },
    })
    if (!owner) return null
    candidates = [owner.userId]
  }

  const loads = await prisma.conversation.groupBy({
    by: ['assignedToId'],
    where: {
      websiteId: websiteDbId,
      status: { in: ['OPEN', 'PENDING'] },
      assignedToId: { in: candidates },
    },
    _count: { id: true },
  })

  const loadMap = new Map(loads.map((l) => [l.assignedToId!, l._count.id]))
  candidates.sort((a, b) => (loadMap.get(a) ?? 0) - (loadMap.get(b) ?? 0))

  const picked = candidates[0]
  if (!picked) return null

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { assignedToId: picked },
  })

  return picked
}
