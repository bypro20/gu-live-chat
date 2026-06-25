import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { resolveLiveVisitors } from '@/lib/socket-live-bridge'
import { requireAdmin } from '@/lib/admin-auth'
import {
  enrichLiveSessionsBatch,
  fetchLatestSessionProfiles,
  type VisitorLiveProfile,
} from '@/lib/visitor-live-enrich'

const sessionInclude = {
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
  pages: { orderBy: { viewedAt: 'desc' as const }, take: 8 },
} as const

function applyLiveProfile<T extends Record<string, unknown>>(
  base: T,
  profile?: VisitorLiveProfile | null
): T {
  if (!profile) return base
  return {
    ...base,
    name: profile.name || (base.name as string),
    email: profile.email ?? base.email,
    browser: profile.browser ?? base.browser,
    os: profile.os ?? base.os,
    device: profile.device ?? base.device,
    deviceType: profile.deviceType ?? base.deviceType,
    country: profile.country ?? base.country,
    city: profile.city ?? base.city,
    region: profile.region ?? base.region,
    latitude: profile.latitude ?? base.latitude,
    longitude: profile.longitude ?? base.longitude,
    district: profile.district ?? base.district,
    postalCode: profile.postalCode ?? base.postalCode,
    geoAddress: profile.geoAddress ?? base.geoAddress,
    geoSource: profile.geoSource ?? base.geoSource,
    entrySource: profile.entrySource ?? base.entrySource,
    isp: profile.isp ?? base.isp,
    landingPage: profile.landingPage ?? base.landingPage,
    referrer: profile.referrer ?? base.referrer,
    ipAddress: profile.ipAddress ?? base.ipAddress,
    currentPage: profile.currentPage || (base.currentPage as string),
    currentTitle: profile.currentTitle || (base.currentTitle as string),
  }
}

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

      const liveVisitors = await resolveLiveVisitors(website.websiteId)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
      const recentSessions = await prisma.visitorSession.findMany({
        where: {
          websiteId: website.id,
          endedAt: null,
          lastActiveAt: { gte: fiveMinAgo },
        },
        include: sessionInclude,
        orderBy: { lastActiveAt: 'desc' },
      })

      const enrichedProfiles = await enrichLiveSessionsBatch(
        recentSessions.map((s) => ({
          ...s,
          browser: s.browser,
          os: s.os,
          device: s.device,
        }))
      )

      const liveSocketIds = new Set(liveVisitors.map((v) => v.visitorId))
      const merged = [
        ...liveVisitors.map((lv) => {
          const db = recentSessions.find((s) => s.visitorId === lv.visitorId)
          const profile = enrichedProfiles.get(lv.visitorId)
          return applyLiveProfile(
            {
              sessionId: db?.sessionId,
              visitorId: lv.visitorId,
              name: db?.visitor.name || profile?.name || 'Anonim',
              email: db?.visitor.email ?? profile?.email,
              browser: db?.visitor.browser ?? profile?.browser,
              os: db?.visitor.os ?? profile?.os,
              device: db?.visitor.device ?? profile?.device,
              deviceType: db?.deviceType ?? profile?.deviceType,
              country: db?.visitor.country || db?.country || profile?.country,
              city: db?.visitor.city || db?.city || profile?.city,
              ipAddress: db?.ipAddress ?? profile?.ipAddress,
              region: db?.region ?? profile?.region,
              latitude: db?.latitude ?? profile?.latitude,
              longitude: db?.longitude ?? profile?.longitude,
              district: db?.district ?? profile?.district,
              postalCode: db?.postalCode ?? profile?.postalCode,
              geoAddress: db?.geoAddress ?? profile?.geoAddress,
              geoSource: db?.geoSource ?? profile?.geoSource,
              entrySource: db?.entrySource ?? profile?.entrySource,
              isp: db?.isp ?? profile?.isp,
              currentPage: lv.currentPage || db?.currentPage || profile?.currentPage || '',
              currentTitle: lv.currentTitle || db?.currentTitle || profile?.currentTitle || '',
              landingPage: db?.landingPage ?? profile?.landingPage,
              referrer: db?.referrer ?? profile?.referrer,
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
              pages:
                db?.pages?.map((p) => ({
                  title: p.title,
                  url: p.url,
                  viewedAt: p.viewedAt.toISOString(),
                })) || [],
              websiteId: website.websiteId,
              websiteName: website.name,
              isLive: true,
            },
            profile
          )
        }),
        ...recentSessions
          .filter((s) => !liveSocketIds.has(s.visitorId))
          .map((s) => {
            const profile = enrichedProfiles.get(s.visitorId)
            return applyLiveProfile(
              {
                sessionId: s.sessionId,
                visitorId: s.visitor.id,
                name: s.visitor.name || profile?.name || 'Anonim',
                email: s.visitor.email ?? profile?.email,
                browser: s.visitor.browser ?? profile?.browser,
                os: s.visitor.os ?? profile?.os,
                device: s.visitor.device ?? profile?.device,
                deviceType: s.deviceType ?? profile?.deviceType,
                country: s.visitor.country || s.country || profile?.country,
                city: s.visitor.city || s.city || profile?.city,
                ipAddress: s.ipAddress ?? profile?.ipAddress,
                region: s.region ?? profile?.region,
                latitude: s.latitude ?? profile?.latitude,
                longitude: s.longitude ?? profile?.longitude,
                district: s.district ?? profile?.district,
                postalCode: s.postalCode ?? profile?.postalCode,
                geoAddress: s.geoAddress ?? profile?.geoAddress,
                geoSource: s.geoSource ?? profile?.geoSource,
                entrySource: s.entrySource ?? profile?.entrySource,
                isp: s.isp ?? profile?.isp,
                currentPage: s.currentPage || profile?.currentPage || '',
                currentTitle: s.currentTitle || profile?.currentTitle || '',
                landingPage: s.landingPage ?? profile?.landingPage,
                referrer: s.referrer ?? profile?.referrer,
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
              },
              profile
            )
          }),
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
        ...sessionInclude,
        website: {
          select: { id: true, websiteId: true, name: true },
        },
      },
      orderBy: { lastActiveAt: 'desc' },
      take: 200,
    })

    const enrichedProfiles = await enrichLiveSessionsBatch(
      allActiveSessions.map((s) => ({
        ...s,
        browser: s.browser,
        os: s.os,
        device: s.device,
      }))
    )

    const socketByVisitor = new Map(
      (await resolveLiveVisitors()).map((v) => [v.visitorId, v])
    )

    const visitors = allActiveSessions.map((s) => {
      const live = socketByVisitor.get(s.visitor.id)
      const profile = enrichedProfiles.get(s.visitorId)
      return applyLiveProfile(
        {
          sessionId: s.sessionId,
          visitorId: s.visitor.id,
          name: s.visitor.name || profile?.name || 'Anonim',
          email: s.visitor.email ?? profile?.email,
          browser: s.visitor.browser ?? profile?.browser,
          os: s.visitor.os ?? profile?.os,
          device: s.visitor.device ?? profile?.device,
          deviceType: s.deviceType ?? profile?.deviceType,
          country: s.visitor.country || s.country || profile?.country,
          city: s.visitor.city || s.city || profile?.city,
          ipAddress: s.ipAddress ?? profile?.ipAddress,
          region: s.region ?? profile?.region,
          latitude: s.latitude ?? profile?.latitude,
          longitude: s.longitude ?? profile?.longitude,
          district: s.district ?? profile?.district,
          postalCode: s.postalCode ?? profile?.postalCode,
          geoAddress: s.geoAddress ?? profile?.geoAddress,
          geoSource: s.geoSource ?? profile?.geoSource,
          entrySource: s.entrySource ?? profile?.entrySource,
          isp: s.isp ?? profile?.isp,
          currentPage: live?.currentPage || s.currentPage || profile?.currentPage || '',
          currentTitle: live?.currentTitle || s.currentTitle || profile?.currentTitle || '',
          landingPage: s.landingPage ?? profile?.landingPage,
          referrer: s.referrer ?? profile?.referrer,
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
        },
        profile
      )
    })

    // Socket-only visitors not yet in DB batch
    const dbVisitorIds = new Set(allActiveSessions.map((s) => s.visitorId))
    const socketOnly = (await resolveLiveVisitors()).filter((live) => !dbVisitorIds.has(live.visitorId))
    const socketProfiles = await fetchLatestSessionProfiles(socketOnly.map((v) => v.visitorId))

    for (const live of socketOnly) {
      const site = allWebsites.find((w) => w.websiteId === live.websiteId)
      const profile = socketProfiles.get(live.visitorId)
      visitors.unshift(
        applyLiveProfile(
          {
            sessionId: profile?.sessionId || '',
            visitorId: live.visitorId,
            name: profile?.name || 'Anonim',
            email: profile?.email ?? null,
            browser: profile?.browser ?? null,
            os: profile?.os ?? null,
            device: profile?.device ?? null,
            deviceType: profile?.deviceType ?? null,
            country: profile?.country ?? null,
            city: profile?.city ?? null,
            ipAddress: profile?.ipAddress ?? null,
            region: profile?.region ?? null,
            latitude: profile?.latitude ?? null,
            longitude: profile?.longitude ?? null,
            district: profile?.district ?? null,
            postalCode: profile?.postalCode ?? null,
            geoAddress: profile?.geoAddress ?? null,
            geoSource: profile?.geoSource ?? null,
            entrySource: profile?.entrySource ?? null,
            isp: profile?.isp ?? null,
            currentPage: live.currentPage || profile?.currentPage || '',
            currentTitle: live.currentTitle || profile?.currentTitle || '',
            landingPage: profile?.landingPage || live.currentPage,
            referrer: profile?.referrer ?? null,
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
            websiteName: site?.name || profile?.websiteName || live.websiteId,
            isLive: true,
          },
          profile
        )
      )
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
