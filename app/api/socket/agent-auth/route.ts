import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureAdminMarketingAccess } from '@/lib/marketing-website'
import { rateLimitByIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const limited = rateLimitByIp(req, 'socket-agent-auth', 60, 60_000)
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
  }

  let body: { websiteIds?: unknown; scope?: unknown } = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const requestedWebsiteIds = Array.isArray(body.websiteIds)
    ? body.websiteIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : []
  const scope = body.scope === 'platform' ? 'platform' : undefined
  const userId = session.user.id

  let websiteIds: string[] = []

  if (requestedWebsiteIds.length > 0) {
    try {
      const [memberships, ownedWebsites] = await Promise.all([
        prisma.teamMember.findMany({
          where: {
            userId,
            website: { websiteId: { in: requestedWebsiteIds } },
          },
          select: { website: { select: { websiteId: true } } },
        }),
        prisma.website.findMany({
          where: { ownerId: userId, websiteId: { in: requestedWebsiteIds } },
          select: { websiteId: true },
        }),
      ])
      const allowed = new Set<string>()
      for (const m of memberships) allowed.add(m.website.websiteId)
      for (const w of ownedWebsites) allowed.add(w.websiteId)
      websiteIds = requestedWebsiteIds.filter((id) => allowed.has(id))
    } catch (err) {
      console.error('[socket/agent-auth] membership check failed:', err)
      return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }
  }

  if (websiteIds.length === 0) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })
      if (user?.role === 'ADMIN') {
        if (scope === 'platform') {
          const allSites = await prisma.website.findMany({ select: { websiteId: true } })
          websiteIds = allSites.map((w) => w.websiteId)
        } else if (requestedWebsiteIds.length > 0) {
          const marketingId = await ensureAdminMarketingAccess(userId)
          if (requestedWebsiteIds.includes(marketingId)) {
            websiteIds = [marketingId]
          }
        }
      }
    } catch (err) {
      console.error('[socket/agent-auth] admin scope failed:', err)
    }
  }

  if (websiteIds.length === 0 && scope !== 'platform') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  return NextResponse.json({
    userId,
    websiteIds,
    ...(scope ? { scope } : {}),
  })
}
