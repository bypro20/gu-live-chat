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

    const hasVisitorTracking = await websiteHasFeature(website.id, website.plan, 'visitorTracking')
    if (!hasVisitorTracking) {
      return NextResponse.json({
        error: 'Ziyaretçi takibi başlangıç paketinde veya eklenti ile kullanılabilir',
        upgradeRequired: true,
        requiredPlan: 'STARTER',
        feature: 'visitorTracking',
      }, { status: 403 })
    }

    const hasOverlayAI = await websiteHasFeature(website.id, website.plan, 'overlayAI')

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
        pages: { orderBy: { viewedAt: 'desc' }, take: 8 },
      },
      orderBy: { lastActiveAt: 'desc' },
    })

    const liveVisitors = getLiveVisitors(website.websiteId)
    const liveSocketIds = new Set(liveVisitors.map(v => v.visitorId))

    const visitors = activeSessions.map((s) => {
      const liveData = liveVisitors.find(v => v.visitorId === s.visitor.id)
      return {
        sessionId: s.sessionId,
        visitorId: s.visitor.id,
        name: s.visitor.name || 'Anonim',
        email: s.visitor.email,
        browser: s.browser || s.visitor.browser,
        os: s.os || s.visitor.os,
        device: s.device || s.visitor.device,
        country: s.country || s.visitor.country,
        city: s.city || s.visitor.city,
        region: s.region,
        latitude: s.latitude,
        longitude: s.longitude,
        ipAddress: s.ipAddress,
        currentPage: liveData?.currentPage || s.currentPage || '',
        currentTitle: liveData?.currentTitle || s.currentTitle || '',
        cursorX: liveData?.cursorX,
        cursorY: liveData?.cursorY,
        viewportW: liveData?.viewportW,
        viewportH: liveData?.viewportH,
        scrollY: liveData?.scrollY,
        documentH: liveData?.documentH,
        screenshotUrl: liveData?.screenshotUrl,
        screenshotAt: liveData?.screenshotAt,
        landingPage: s.landingPage,
        referrer: s.referrer,
        startedAt: s.startedAt.toISOString(),
        lastActiveAt: liveData?.lastActiveAt || s.lastActiveAt.toISOString(),
        pages: s.pages.map((p) => ({
          title: p.title,
          url: p.url,
          viewedAt: p.viewedAt.toISOString(),
        })),
        isLive: liveSocketIds.has(s.visitor.id),
        websiteId: website.websiteId,
        websiteName: website.name,
      }
    })

    for (const live of liveVisitors) {
      if (visitors.some((v) => v.visitorId === live.visitorId)) continue
      visitors.unshift({
        sessionId: '',
        visitorId: live.visitorId,
        name: 'Anonim',
        email: null,
        browser: null,
        os: null,
        device: null,
        country: null,
        city: null,
        region: null,
        latitude: null,
        longitude: null,
        ipAddress: null,
        currentPage: live.currentPage || '',
        currentTitle: live.currentTitle || '',
        landingPage: live.currentPage,
        referrer: null,
        startedAt: live.connectedAt,
        lastActiveAt: live.lastActiveAt,
        cursorX: live.cursorX,
        cursorY: live.cursorY,
        viewportW: live.viewportW,
        viewportH: live.viewportH,
        scrollY: live.scrollY,
        documentH: live.documentH,
        screenshotUrl: live.screenshotUrl,
        screenshotAt: live.screenshotAt,
        pages: live.currentPage
          ? [{ title: live.currentTitle, url: live.currentPage, viewedAt: live.lastActiveAt }]
          : [],
        isLive: true,
        websiteId: website.websiteId,
        websiteName: website.name,
      })
    }

    return NextResponse.json({
      count: visitors.length,
      visitors,
      overlayEnabled: hasOverlayAI,
    })
  } catch (error) {
    console.error('[Visitors Live API] Error:', error)
    return NextResponse.json({ error: 'Ziyaretçiler alınamadı' }, { status: 500 })
  }
}