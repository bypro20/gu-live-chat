import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getLiveVisitors } from '@/lib/socket'
import { requireAdmin } from '@/lib/admin-auth'

// GET /api/admin/visitors/live?websiteId=xxx
export async function GET(req: Request) {
  try {
    const check = await requireAdmin()
    if ('error' in check) return check.error

    const { searchParams } = new URL(req.url)
    const websiteIdFilter = searchParams.get('websiteId')

    // If a specific website is requested, get live visitors for that site
    if (websiteIdFilter) {
      const website = await prisma.website.findUnique({
        where: { websiteId: websiteIdFilter },
        select: { id: true, name: true, websiteId: true },
      })

      if (!website) {
        return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
      }

      // Get real-time visitors from Socket.io in-memory map (use public websiteId for socket rooms)
      const liveVisitors = getLiveVisitors(website.websiteId)

      // Also get recently active sessions from DB (for visitors whose socket may have just disconnected)
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
        },
        orderBy: { lastActiveAt: 'desc' },
      })

      // Merge: live visitors (from Socket.io) + recent DB sessions
      const liveSocketIds = new Set(liveVisitors.map(v => v.visitorId))
      const merged = [
        ...liveVisitors,
        ...recentSessions
          .filter(s => !liveSocketIds.has(s.visitorId))
          .map(s => ({
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
            startedAt: s.startedAt,
            lastActiveAt: s.lastActiveAt,
            websiteId: website.websiteId,
            websiteName: website.name,
            isLive: liveSocketIds.has(s.visitor.id),
          })),
      ]

      return NextResponse.json({ count: merged.length, visitors: merged })
    }

    // No specific website — get all websites with active visitors
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
      },
      orderBy: { lastActiveAt: 'desc' },
      take: 100,
    })

    const visitors = allActiveSessions.map(s => ({
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
      startedAt: s.startedAt,
      lastActiveAt: s.lastActiveAt,
      websiteId: s.website.websiteId,
      websiteName: s.website.name,
      isLive: true, // assumed live since lastActiveAt < 5min
    }))

    return NextResponse.json({
      count: visitors.length,
      visitors,
      totalWebsites: allWebsites.length,
    })
  } catch (error) {
    console.error('[Admin Visitors Live API] Error:', error)
    return NextResponse.json({ error: 'Ziyaretçiler alınamadı' }, { status: 500 })
  }
}