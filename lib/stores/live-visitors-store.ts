import { create } from 'zustand'

export interface LiveVisitor {
  visitorId: string
  name?: string
  email?: string
  browser?: string | null
  os?: string | null
  device?: string | null
  deviceType?: string | null
  country?: string | null
  city?: string | null
  currentPage: string
  currentTitle?: string
  landingPage?: string | null
  referrer?: string | null
  startedAt?: string
  lastActiveAt?: string
  isLive: boolean
  sessionId?: string
  websiteId?: string
  websiteName?: string
  ipAddress?: string | null
  region?: string | null
  latitude?: number | null
  longitude?: number | null
  district?: string | null
  postalCode?: string | null
  geoAddress?: string | null
  geoSource?: string | null
  entrySource?: string | null
  isp?: string | null
  pages?: { title: string | null; url: string; viewedAt: string }[]
  // Cursor tracking
  cursorX?: number
  cursorY?: number
  viewportW?: number
  viewportH?: number
  scrollY?: number
  documentH?: number
  // Screen monitoring
  screenshotUrl?: string | null
  screenshotAt?: string | null
}

export interface VisitorActivity {
  visitorId: string
  eventType: 'pageview' | 'typing' | 'click' | 'scroll' | 'input' | 'mousemove' | 'focus' | 'online' | 'offline'
  url?: string
  title?: string
  selector?: string
  text?: string
  fieldName?: string
  fieldType?: string
  x?: number
  y?: number
  scrollPercentage?: number
  viewportH?: number
  documentH?: number
  timestamp: string
}

interface LiveVisitorsState {
  visitors: Map<string, LiveVisitor>
  activities: VisitorActivity[]
  selectedVisitorId: string | null
  loading: boolean
  error: string | null

  // Actions
  setVisitors: (visitors: LiveVisitor[]) => void
  addVisitor: (visitor: LiveVisitor) => void
  updateVisitor: (visitorId: string, updates: Partial<LiveVisitor>) => void
  removeVisitor: (visitorId: string) => void
  updateCursor: (visitorId: string, x: number, y: number, viewportW?: number, viewportH?: number) => void
  updateScreenshot: (visitorId: string, screenshotUrl: string, timestamp?: string, extras?: Pick<LiveVisitor, 'viewportW' | 'viewportH' | 'scrollY'>) => void
  addActivity: (activity: VisitorActivity) => void
  selectVisitor: (visitorId: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const MAX_ACTIVITIES = 200
const STALE_OFFLINE_MS = 10 * 60 * 1000

function mergeLiveVisitor(existing: LiveVisitor | undefined, incoming: LiveVisitor): LiveVisitor {
  if (!existing) return incoming
  return {
    ...existing,
    ...incoming,
    country: incoming.country ?? existing.country,
    city: incoming.city ?? existing.city,
    region: incoming.region ?? existing.region,
    latitude: incoming.latitude ?? existing.latitude,
    longitude: incoming.longitude ?? existing.longitude,
    district: incoming.district ?? existing.district,
    postalCode: incoming.postalCode ?? existing.postalCode,
    geoAddress: incoming.geoAddress ?? existing.geoAddress,
    geoSource: incoming.geoSource ?? existing.geoSource,
    entrySource: incoming.entrySource ?? existing.entrySource,
    browser: incoming.browser ?? existing.browser,
    os: incoming.os ?? existing.os,
    device: incoming.device ?? existing.device,
    deviceType: incoming.deviceType ?? existing.deviceType,
    cursorX: existing.cursorX ?? incoming.cursorX,
    cursorY: existing.cursorY ?? incoming.cursorY,
    viewportW: existing.viewportW ?? incoming.viewportW,
    viewportH: existing.viewportH ?? incoming.viewportH,
    scrollY: existing.scrollY ?? incoming.scrollY,
    documentH: existing.documentH ?? incoming.documentH,
    screenshotUrl: existing.screenshotUrl ?? incoming.screenshotUrl,
    screenshotAt: existing.screenshotAt ?? incoming.screenshotAt,
    isLive: existing.isLive || incoming.isLive,
    lastActiveAt:
      existing.lastActiveAt && incoming.lastActiveAt
        ? new Date(existing.lastActiveAt) > new Date(incoming.lastActiveAt)
          ? existing.lastActiveAt
          : incoming.lastActiveAt
        : existing.lastActiveAt || incoming.lastActiveAt,
  }
}

function pruneStaleOfflineVisitors(map: Map<string, LiveVisitor>, apiIds: Set<string>) {
  const now = Date.now()
  for (const [id, visitor] of map) {
    if (visitor.isLive) continue
    if (apiIds.has(id)) continue
    const last = visitor.lastActiveAt ? new Date(visitor.lastActiveAt).getTime() : 0
    if (now - last > STALE_OFFLINE_MS) map.delete(id)
  }
}

export const useLiveVisitorsStore = create<LiveVisitorsState>((set) => ({
  visitors: new Map(),
  activities: [],
  selectedVisitorId: null,
  loading: false,
  error: null,

  setVisitors: (visitors) =>
    set((state) => {
      const newMap = new Map(state.visitors)
      const apiIds = new Set<string>()

      for (const incoming of visitors) {
        apiIds.add(incoming.visitorId)
        const existing = newMap.get(incoming.visitorId)
        newMap.set(incoming.visitorId, mergeLiveVisitor(existing, incoming))
      }

      pruneStaleOfflineVisitors(newMap, apiIds)
      return { visitors: newMap }
    }),

  addVisitor: (visitor) =>
    set((state) => {
      const newMap = new Map(state.visitors)
      const existing = newMap.get(visitor.visitorId)
      newMap.set(visitor.visitorId, mergeLiveVisitor(existing, visitor))
      return { visitors: newMap }
    }),

  updateVisitor: (visitorId, updates) =>
    set((state) => {
      const newMap = new Map(state.visitors)
      const existing = newMap.get(visitorId)
      if (existing) {
        newMap.set(visitorId, { ...existing, ...updates })
      }
      return { visitors: newMap }
    }),

  removeVisitor: (visitorId) =>
    set((state) => {
      const newMap = new Map(state.visitors)
      newMap.delete(visitorId)
      return {
        visitors: newMap,
        selectedVisitorId: state.selectedVisitorId === visitorId ? null : state.selectedVisitorId,
      }
    }),

  updateCursor: (visitorId, x, y, viewportW, viewportH) =>
    set((state) => {
      const existing = state.visitors.get(visitorId)
      if (!existing) return state
      const newMap = new Map(state.visitors)
      newMap.set(visitorId, {
        ...existing,
        cursorX: x,
        cursorY: y,
        ...(viewportW !== undefined ? { viewportW } : {}),
        ...(viewportH !== undefined ? { viewportH } : {}),
      })
      return { visitors: newMap }
    }),

  updateScreenshot: (visitorId, screenshotUrl, timestamp, extras) =>
    set((state) => {
      const newMap = new Map(state.visitors)
      const existing = newMap.get(visitorId)
      if (existing) {
        newMap.set(visitorId, {
          ...existing,
          screenshotUrl,
          screenshotAt: timestamp || new Date().toISOString(),
          ...(extras || {}),
        })
      }
      return { visitors: newMap }
    }),

  addActivity: (activity) =>
    set((state) => {
      // Don't store mousemove activities (too high volume) — only keep meaningful events
      if (activity.eventType === 'mousemove') return { activities: state.activities }

      const activities = [activity, ...state.activities].slice(0, MAX_ACTIVITIES)
      return { activities }
    }),

  selectVisitor: (visitorId) => set({ selectedVisitorId: visitorId }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      visitors: new Map(),
      activities: [],
      selectedVisitorId: null,
      loading: false,
      error: null,
    }),
}))