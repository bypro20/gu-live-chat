import { prisma } from '@/lib/db'
import { lookupIpGeo } from '@/lib/geo'
import { parseUserAgent } from '@/lib/user-agent'

export type VisitorLiveProfile = {
  name: string
  email: string | null
  browser: string | null
  os: string | null
  device: string | null
  deviceType: string | null
  country: string | null
  city: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
  district: string | null
  postalCode: string | null
  geoAddress: string | null
  geoSource: string | null
  entrySource: string | null
  isp: string | null
  landingPage: string | null
  referrer: string | null
  currentPage: string | null
  currentTitle: string | null
  ipAddress: string | null
}

type EnrichInput = {
  sessionDbId?: string
  sessionId?: string | null
  visitorDbId?: string
  ipAddress?: string | null
  userAgent?: string | null
  name?: string | null
  email?: string | null
  browser?: string | null
  os?: string | null
  device?: string | null
  deviceType?: string | null
  country?: string | null
  city?: string | null
  region?: string | null
  latitude?: number | null
  longitude?: number | null
  district?: string | null
  postalCode?: string | null
  geoAddress?: string | null
  geoSource?: string | null
  entrySource?: string | null
  isp?: string | null
  landingPage?: string | null
  referrer?: string | null
  currentPage?: string | null
  currentTitle?: string | null
}

function pickString(...values: Array<string | null | undefined>): string | null {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

function pickNumber(...values: Array<number | null | undefined>): number | null {
  for (const v of values) {
    if (typeof v === 'number' && Number.isFinite(v)) return v
  }
  return null
}

export async function enrichVisitorLiveProfile(
  input: EnrichInput,
  options: { persist?: boolean } = {}
): Promise<VisitorLiveProfile> {
  let browser = pickString(input.browser)
  let os = pickString(input.os)
  let device = pickString(input.device)
  let deviceType = pickString(input.deviceType)

  if ((!browser || !os || !device || !deviceType) && input.userAgent) {
    const ua = parseUserAgent(input.userAgent)
    browser = browser || ua.browser
    os = os || ua.os
    device = device || ua.device
    deviceType = deviceType || ua.deviceType
  }

  let country = pickString(input.country)
  let city = pickString(input.city)
  let region = pickString(input.region)
  let latitude = pickNumber(input.latitude)
  let longitude = pickNumber(input.longitude)
  let district = pickString(input.district)
  let postalCode = pickString(input.postalCode)
  let geoAddress = pickString(input.geoAddress)
  let geoSource = pickString(input.geoSource)
  let isp = pickString(input.isp)

  const ip = pickString(input.ipAddress)
  if ((!country || latitude == null) && ip) {
    const geo = await lookupIpGeo(ip)
    if (geo) {
      country = country || geo.country
      city = city || geo.city
      region = region || geo.region
      district = district || geo.district
      postalCode = postalCode || geo.postalCode
      latitude = latitude ?? geo.latitude
      longitude = longitude ?? geo.longitude
      geoAddress = geoAddress || geo.geoAddress
      isp = isp || geo.isp
      if (!geoSource && geo.latitude != null) geoSource = 'ip'
    }
  }

  const profile: VisitorLiveProfile = {
    name: pickString(input.name) || 'Anonim',
    email: pickString(input.email),
    browser,
    os,
    device,
    deviceType,
    country,
    city,
    region,
    latitude,
    longitude,
    district,
    postalCode,
    geoAddress,
    geoSource,
    entrySource: pickString(input.entrySource),
    isp,
    landingPage: pickString(input.landingPage),
    referrer: pickString(input.referrer),
    currentPage: pickString(input.currentPage),
    currentTitle: pickString(input.currentTitle),
    ipAddress: ip,
  }

  if (options.persist && input.sessionDbId && (country || latitude != null || browser)) {
    void prisma.visitorSession
      .update({
        where: { id: input.sessionDbId },
        data: {
          ...(country ? { country } : {}),
          ...(city ? { city } : {}),
          ...(region ? { region } : {}),
          ...(latitude != null ? { latitude } : {}),
          ...(longitude != null ? { longitude } : {}),
          ...(district ? { district } : {}),
          ...(postalCode ? { postalCode } : {}),
          ...(geoAddress ? { geoAddress } : {}),
          ...(geoSource ? { geoSource } : {}),
          ...(isp ? { isp } : {}),
          ...(browser ? { browser } : {}),
          ...(os ? { os } : {}),
          ...(device ? { device } : {}),
          ...(deviceType ? { deviceType } : {}),
          ...(input.userAgent ? { userAgent: input.userAgent } : {}),
          ...(ip ? { ipAddress: ip } : {}),
        },
      })
      .catch(() => {})

    if (input.visitorDbId && (country || city || browser)) {
      void prisma.visitor
        .update({
          where: { id: input.visitorDbId },
          data: {
            ...(country ? { country } : {}),
            ...(city ? { city } : {}),
            ...(device ? { device } : {}),
            ...(browser ? { browser } : {}),
            ...(os ? { os } : {}),
            ...(device ? { device } : {}),
          },
        })
        .catch(() => {})
    }
  }

  return profile
}

export async function enrichLiveSessionsBatch<
  T extends {
    id: string
    sessionId: string
    visitorId: string
    ipAddress: string | null
    userAgent: string | null
    country: string | null
    city: string | null
    region: string | null
    latitude: number | null
    longitude: number | null
    district: string | null
    postalCode: string | null
    geoAddress: string | null
    geoSource: string | null
    entrySource: string | null
    isp: string | null
    landingPage: string | null
    referrer: string | null
    currentPage: string | null
    currentTitle: string | null
    browser: string | null
    os: string | null
    device: string | null
    deviceType: string | null
    visitor: {
      id: string
      name: string | null
      email: string | null
      browser: string | null
      os: string | null
      device: string | null
      country: string | null
      city: string | null
    }
  },
>(sessions: T[]): Promise<Map<string, VisitorLiveProfile>> {
  const out = new Map<string, VisitorLiveProfile>()
  const limited = sessions.slice(0, 40)

  await Promise.all(
    limited.map(async (s) => {
      const profile = await enrichVisitorLiveProfile(
        {
          sessionDbId: s.id,
          sessionId: s.sessionId,
          visitorDbId: s.visitor.id,
          ipAddress: s.ipAddress,
          userAgent: s.userAgent,
          name: s.visitor.name,
          email: s.visitor.email,
          browser: s.browser || s.visitor.browser,
          os: s.os || s.visitor.os,
          device: s.device || s.visitor.device,
          deviceType: s.deviceType,
          country: s.country || s.visitor.country,
          city: s.city || s.visitor.city,
          region: s.region,
          latitude: s.latitude,
          longitude: s.longitude,
          district: s.district,
          postalCode: s.postalCode,
          geoAddress: s.geoAddress,
          geoSource: s.geoSource,
          entrySource: s.entrySource,
          isp: s.isp,
          landingPage: s.landingPage,
          referrer: s.referrer,
          currentPage: s.currentPage,
          currentTitle: s.currentTitle,
        },
        { persist: true }
      )
      out.set(s.visitorId, profile)
    })
  )

  return out
}

export async function fetchLatestSessionProfiles(
  visitorIds: string[]
): Promise<Map<string, VisitorLiveProfile & { sessionId: string; websiteId?: string; websiteName?: string }>> {
  if (visitorIds.length === 0) return new Map()

  const sessions = await prisma.visitorSession.findMany({
    where: { visitorId: { in: visitorIds.slice(0, 50) }, endedAt: null },
    orderBy: { lastActiveAt: 'desc' },
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
      website: { select: { websiteId: true, name: true } },
    },
  })

  const byVisitor = new Map<string, (typeof sessions)[0]>()
  for (const s of sessions) {
    if (!byVisitor.has(s.visitorId)) byVisitor.set(s.visitorId, s)
  }

  const profiles = await enrichLiveSessionsBatch([...byVisitor.values()])
  const out = new Map<
    string,
    VisitorLiveProfile & { sessionId: string; websiteId?: string; websiteName?: string }
  >()

  for (const [visitorId, session] of byVisitor) {
    const profile = profiles.get(visitorId)
    if (!profile) continue
    out.set(visitorId, {
      ...profile,
      sessionId: session.sessionId,
      websiteId: session.website.websiteId,
      websiteName: session.website.name,
    })
  }

  return out
}
