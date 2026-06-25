import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { websiteHasFeature } from '@/lib/addon-features'
import { resolveLiveVisitors } from '@/lib/socket-live-bridge'
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

// GET /api/visitors/live?websiteId=xxx
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const websiteIdParam = searchParams.get('websiteId')

    const userWebsites = await prisma.website.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      select: {
        id: true,
        websiteId: true,
        name: true,
        plan: true,
        ownerId: true,
        members: { where: { userId: session.user.id } },
      },
    })

    if (userWebsites.length === 0) {
      return NextResponse.json({ count: 0, visitors: [] })
    }

    let website = websiteIdParam
      ? userWebsites.find((w) => w.websiteId === websiteIdParam)
      : userWebsites[0]

    if (!website) {
      if (websiteIdParam) {
        const found = await prisma.website.findUnique({
          where: { websiteId: websiteIdParam },
          select: {
            id: true,
            websiteId: true,
            name: true,
            plan: true,
            ownerId: true,
            members: { where: { userId: session.user.id } },
          },
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
      return NextResponse.json(
        {
          error: 'Ziyaretçi takibi başlangıç paketinde veya eklenti ile kullanılabilir',
          upgradeRequired: true,
          requiredPlan: 'STARTER',
          feature: 'visitorTracking',
        },
        { status: 403 }
      )
    }

    const hasOverlayAI = await websiteHasFeature(website.id, website.plan, 'overlayAI')
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)

    const activeSessions = await prisma.visitorSession.findMany({
      where: {
        websiteId: website.id,
        endedAt: null,
        lastActiveAt: { gte: thirtyMinAgo },
      },
      include: sessionInclude,
      orderBy: { lastActiveAt: 'desc' },
    })

    const enrichedProfiles = await enrichLiveSessionsBatch(
      activeSessions.map((s) => ({
        ...s,
        browser: s.browser,
        os: s.os,
        device: s.device,
      }))
    )

    const liveVisitors = await resolveLiveVisitors(website.websiteId)
    const liveSocketIds = new Set(liveVisitors.map((v) => v.visitorId))

    const visitors = activeSessions.map((s) => {
      const liveData = liveVisitors.find((v) => v.visitorId === s.visitor.id)
      const profile = enrichedProfiles.get(s.visitorId)
      return applyLiveProfile(
        {
          sessionId: s.sessionId,
          visitorId: s.visitor.id,
          name: s.visitor.name || profile?.name || 'Anonim',
          email: s.visitor.email ?? profile?.email,
          browser: s.browser || s.visitor.browser || profile?.browser,
          os: s.os || s.visitor.os || profile?.os,
          device: s.device || s.visitor.device || profile?.device,
          deviceType: s.deviceType ?? profile?.deviceType,
          country: s.country || s.visitor.country || profile?.country,
          city: s.city || s.visitor.city || profile?.city,
          region: s.region ?? profile?.region,
          latitude: s.latitude ?? profile?.latitude,
          longitude: s.longitude ?? profile?.longitude,
          district: s.district ?? profile?.district,
          postalCode: s.postalCode ?? profile?.postalCode,
          geoAddress: s.geoAddress ?? profile?.geoAddress,
          geoSource: s.geoSource ?? profile?.geoSource,
          entrySource: s.entrySource ?? profile?.entrySource,
          isp: s.isp ?? profile?.isp,
          ipAddress: s.ipAddress ?? profile?.ipAddress,
          currentPage: liveData?.currentPage || s.currentPage || profile?.currentPage || '',
          currentTitle: liveData?.currentTitle || s.currentTitle || profile?.currentTitle || '',
          cursorX: liveData?.cursorX,
          cursorY: liveData?.cursorY,
          viewportW: liveData?.viewportW,
          viewportH: liveData?.viewportH,
          scrollY: liveData?.scrollY,
          documentH: liveData?.documentH,
          screenshotUrl: liveData?.screenshotUrl,
          screenshotAt: liveData?.screenshotAt,
          landingPage: s.landingPage ?? profile?.landingPage,
          referrer: s.referrer ?? profile?.referrer,
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
        },
        profile
      )
    })

    const dbVisitorIds = new Set(activeSessions.map((s) => s.visitorId))
    const socketOnly = liveVisitors.filter((live) => !dbVisitorIds.has(live.visitorId))
    const socketProfiles = await fetchLatestSessionProfiles(socketOnly.map((v) => v.visitorId))

    for (const live of socketOnly) {
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
            region: profile?.region ?? null,
            latitude: profile?.latitude ?? null,
            longitude: profile?.longitude ?? null,
            district: profile?.district ?? null,
            postalCode: profile?.postalCode ?? null,
            geoAddress: profile?.geoAddress ?? null,
            geoSource: profile?.geoSource ?? null,
            entrySource: profile?.entrySource ?? null,
            isp: profile?.isp ?? null,
            ipAddress: profile?.ipAddress ?? null,
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
            isLive: true,
            websiteId: website.websiteId,
            websiteName: website.name,
          },
          profile
        )
      )
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
