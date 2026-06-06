import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { websiteHasFeature } from '@/lib/addon-features'
import { getLiveVisitors } from '@/lib/socket'

// GET /api/visitors/live?websiteId=xxx
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const websiteIdParam = searchParams.get('websiteId')

    // Find the user's websites
    const userWebsites = await prisma.website.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      select: { id: true, websiteId: true, name: true, plan: true, ownerId: true,
        members: { where: { userId: session.user.id } } },
    })

    if (userWebsites.length === 0) {
      return NextResponse.json({ count: 0, visitors: [] })
    }

    // If websiteId specified, use that; otherwise use the first website
    let website = websiteIdParam
      ? userWebsites.find(w => w.websiteId === websiteIdParam)
      : userWebsites[0]

    if (!website) {
      // websiteId not found among user's websites — try finding it directly
      if (websiteIdParam) {
        const found = await prisma.website.findUnique({
          where: { websiteId: websiteIdParam },
          select: { id: true, websiteId: true, name: true, plan: true, ownerId: true,
            members: { where: { userId: session.user.id } } },
        })
        if (!found) {
          return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
        }
        const isOwner = found.ownerId === session.user.id
        const isMember = found.members.length > 0
        if (!isOwner && !isMember) {
          return NextResponse.json({ error: 'Bu siteye erişim izniniz yok' }, { status: 403 })
        }
        website = found
      } else {
        return NextResponse.json({ count: 0, visitors: [] })
      }
    }

    // Check plan: Ekran İzleme requires PRO or BUSINESS
    const hasOverlayAI = await websiteHasFeature(website.id, website.plan, 'overlayAI')
    if (!hasOverlayAI) {
      return NextResponse.json({
        error: 'Ekran İzleme profesyonel ve iş paketlerinde kullanılabilir',
        upgradeRequired: true,
        requiredPlan: 'PRO',
      }, { status: 403 })
    }

    // Get active sessions from DB (endedAt is null and lastActiveAt within 30 min)
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)

    const activeSessions = await prisma.visitorSession.findMany({
      where: {
        websiteId: website.id,
        endedAt: null,
        lastActiveAt: { gte: thirtyMinAgo },
      },
      include: {
        visitor: {
          select: {
            id: true,
            name: true,
            email: true,
            browser: true,
            os: true,
            device: true,
            country: true,
            city: true,
          },
        },
      },
      orderBy: { lastActiveAt: 'desc' },
    })

    // Merge with live Socket.io data (use public websiteId for socket room matching)
    const liveVisitors = getLiveVisitors(website.websiteId)
    const liveSocketIds = new Set(liveVisitors.map(v => v.visitorId))

    const visitors = activeSessions.map((s) => {
      const liveData = liveVisitors.find(v => v.visitorId === s.visitor.id)
      return {
        sessionId: s.sessionId,
        visitorId: s.visitor.id,
        name: s.visitor.name || 'Anonim',
        email: s.visitor.email,
        browser: s.visitor.browser,
        os: s.visitor.os,
        device: s.visitor.device,
        country: s.visitor.country,
        city: s.visitor.city,
        currentPage: liveData?.currentPage || s.currentPage,
        currentTitle: liveData?.currentTitle || s.currentTitle,
        cursorX: liveData?.cursorX,
        cursorY: liveData?.cursorY,
        viewportW: liveData?.viewportW,
        viewportH: liveData?.viewportH,
        scrollY: liveData?.scrollY,
        documentH: liveData?.documentH,
        landingPage: s.landingPage,
        referrer: s.referrer,
        startedAt: s.startedAt,
        lastActiveAt: liveData?.lastActiveAt || s.lastActiveAt,
        isLive: liveSocketIds.has(s.visitor.id),
        websiteId: website.websiteId,
        websiteName: website.name,
      }
    })

    return NextResponse.json({
      count: visitors.length,
      visitors,
    })
  } catch (error) {
    console.error('[Visitors Live API] Error:', error)
    return NextResponse.json({ error: 'Ziyaretçiler alınamadı' }, { status: 500 })
  }
}