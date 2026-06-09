import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getLiveVisitors, getAllLiveVisitors } from '@/lib/socket'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/visitors/live?websiteId=xxx
export async function GET(req: Request) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const { searchParams } = new URL(req.url)
    const websiteIdFilter = searchParams.get('websiteId')

    if (websiteIdFilter) {
      const website = await prisma.website.findUnique({
        where: { websiteId: websiteIdFilter },
        select: { id: true, name: true, websiteId: true },
      })

      if (!website) {
        return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
      }

      const liveVisitors = getLiveVisitors(website.websiteId)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
      const recentSessions = await prisma.visitorSession.findMany({
        where: {
          websiteId: website.id,
          endedAt: null,
          lastActiveAt: { gte: fiveMinAgo },
        },
        include: {
          visitor: {
            select: {
              id: true, name: true, email: true,
              browser: true, os: true, device: true, country: true, city: true,
            },
          },
          pages: { orderBy: { viewedAt: 'desc' }, take: 8 },
        },
        orderBy: { lastActiveAt: 'desc' },
      })

      const liveSocketIds = new Set(liveVisitors.map((v) => v.visitorId))
      const merged = [
        ...liveVisitors.map((lv) => {
          const db = recentSessions.find((s) => s.visitorId === lv.visitorId)
          return {
            sessionId: db?.sessionId,
            visitorId: lv.visitorId,
            name: db?.visitor.name || 'Anonim',
            email: db?.visitor.email,
            browser: db?.visitor.browser,
            os: db?.visitor.os,
            device: db?.visitor.device,
            country: db?.visitor.country || db?.country,
            city: db?.visitor.city || db?.city,
            ipAddress: db?.ipAddress,
            region: db?.region,
            latitude: db?.latitude,
            longitude: db?.longitude,
            currentPage: lv.currentPage || db?.currentPage || '',
            currentTitle: lv.currentTitle || db?.currentTitle || '',
            landingPage: db?.landingPage,
            referrer: db?.referrer,
            startedAt: db?.startedAt?.toISOString(),
            lastActiveAt: lv.lastActiveAt || db?.lastActiveAt?.toISOString(),
            cursorX: lv.cursorX,
            cursorY: lv.cursorY,
            viewportW: lv.viewportW,
            viewportH: lv.viewportH,
            scrollY: lv.scrollY,
            documentH: lv.documentH,
            screenshotUrl: lv.screenshotUrl,
            screenshotAt: lv.screenshotAt,
            pages: db?.pages?.map((p) => ({
              title: p.title,
              url: p.url,
              viewedAt: p.viewedAt.toISOString(),
            })) || [],
            websiteId: website.websiteId,
            websiteName: website.name,
            isLive: true,
          }
        }),
        ...recentSessions
          .filter((s) => !liveSocketIds.has(s.visitorId))
          .map((s) => ({
            sessionId: s.sessionId,
            visitorId: s.visitor.id,
            name: s.visitor.name || 'Anonim',
            email: s.visitor.email,
            browser: s.visitor.browser,
            os: s.visitor.os,
            device: s.visitor.device,
            country: s.visitor.country || s.country,
            city: s.visitor.city || s.city,
            ipAddress: s.ipAddress,
            region: s.region,
            latitude: s.latitude,
            longitude: s.longitude,
            currentPage: s.currentPage,
            currentTitle: s.currentTitle,
            landingPage: s.landingPage,
            referrer: s.referrer,
            startedAt: s.startedAt.toISOString(),
            lastActiveAt: s.lastActiveAt.toISOString(),
            pages: s.pages.map((p) => ({
              title: p.title,
              url: p.url,
              viewedAt: p.viewedAt.toISOString(),
            })),
            websiteId: website.websiteId,
            websiteName: website.name,
            isLive: false,
          })),
      ]

      return NextResponse.json({ count: merged.length, visitors: merged, overlayEnabled: true })
    }

    const allWebsites = await prisma.website.findMany({
      select: { id: true, websiteId: true, name: true },
    })

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    const allActiveSessions = await prisma.visitorSession.findMany({
      where: {
        endedAt: null,
        lastActiveAt: { gte: fiveMinAgo },
      },
      include: {
        visitor: {
          select: {
            id: true, name: true, email: true,
            browser: true, os: true, device: true, country: true, city: true,
          },
        },
        website: {
          select: { id: true, websiteId: true, name: true },
        },
        pages: { orderBy: { viewedAt: 'desc' }, take: 8 },
      },
      orderBy: { lastActiveAt: 'desc' },
      take: 200,
    })

    const socketByVisitor = new Map(
      getAllLiveVisitors().map((v) => [v.visitorId, v])
    )

    const visitors = allActiveSessions.map((s) => {
      const live = socketByVisitor.get(s.visitor.id)
      return {
        sessionId: s.sessionId,
        visitorId: s.visitor.id,
        name: s.visitor.name || 'Anonim',
        email: s.visitor.email,
        browser: s.visitor.browser,
        os: s.visitor.os,
        device: s.visitor.device,
        country: s.visitor.country || s.country,
        city: s.visitor.city || s.city,
        ipAddress: s.ipAddress,
        region: s.region,
        latitude: s.latitude,
        longitude: s.longitude,
        currentPage: live?.currentPage || s.currentPage,
        currentTitle: live?.currentTitle || s.currentTitle,
        landingPage: s.landingPage,
        referrer: s.referrer,
        startedAt: s.startedAt.toISOString(),
        lastActiveAt: live?.lastActiveAt || s.lastActiveAt.toISOString(),
        cursorX: live?.cursorX,
        cursorY: live?.cursorY,
        viewportW: live?.viewportW,
        viewportH: live?.viewportH,
        scrollY: live?.scrollY,
        documentH: live?.documentH,
        screenshotUrl: live?.screenshotUrl,
        screenshotAt: live?.screenshotAt,
        pages: s.pages.map((p) => ({
          title: p.title,
          url: p.url,
          viewedAt: p.viewedAt.toISOString(),
        })),
        websiteId: s.website.websiteId,
        websiteName: s.website.name,
        isLive: !!live,
      }
    })

    // Socket-only visitors not yet in DB batch
    const dbVisitorIds = new Set(allActiveSessions.map((s) => s.visitorId))
    for (const live of getAllLiveVisitors()) {
      if (dbVisitorIds.has(live.visitorId)) continue
      const site = allWebsites.find((w) => w.websiteId === live.websiteId)
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
        ipAddress: null,
        region: null,
        latitude: null,
        longitude: null,
        currentPage: live.currentPage,
        currentTitle: live.currentTitle,
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
        websiteId: live.websiteId,
        websiteName: site?.name || live.websiteId,
        isLive: true,
      })
    }

    return NextResponse.json({
      count: visitors.length,
      visitors,
      totalWebsites: allWebsites.length,
      overlayEnabled: true,
      websiteIds: allWebsites.map((w) => w.websiteId),
    })
  } catch (error) {
    console.error('[Admin Visitors Live API] Error:', error)
    return NextResponse.json({ error: 'Ziyaretçiler alınamadı' }, { status: 500 })
  }
}
