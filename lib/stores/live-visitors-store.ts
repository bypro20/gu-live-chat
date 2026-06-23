import { create } from 'zustand'

export interface LiveVisitor {
  visitorId: string
  name?: string
  email?: string
  browser?: string | null
  os?: string | null
  device?: string | null
  country?: string | null
  city?: string | null
  currentPage: string
  currentTitle?: string
  landingPage?: string
  referrer?: string
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

export const useLiveVisitorsStore = create<LiveVisitorsState>((set) => ({
  visitors: new Map(),
  activities: [],
  selectedVisitorId: null,
  loading: false,
  error: null,

  setVisitors: (visitors) =>
    set((state) => {
      const newMap = new Map<string, LiveVisitor>()
      visitors.forEach((v) => {
        // Preserve existing cursor data from Socket.io (real-time updates)
        const existing = state.visitors.get(v.visitorId)
        if (existing) {
          newMap.set(v.visitorId, {
            ...v,
            // Keep real-time cursor data if it's more recent than API data
            cursorX: existing.cursorX ?? v.cursorX,
            cursorY: existing.cursorY ?? v.cursorY,
            viewportW: existing.viewportW ?? v.viewportW,
            viewportH: existing.viewportH ?? v.viewportH,
            scrollY: existing.scrollY ?? v.scrollY,
            documentH: existing.documentH ?? v.documentH,
            // Keep real-time screenshot data if available
            screenshotUrl: existing.screenshotUrl ?? v.screenshotUrl,
            screenshotAt: existing.screenshotAt ?? v.screenshotAt,
            isLive: existing.isLive || v.isLive,
          })
        } else {
          newMap.set(v.visitorId, v)
        }
      })
      return { visitors: newMap }
    }),

  addVisitor: (visitor) =>
    set((state) => {
      const newMap = new Map(state.visitors)
      newMap.set(visitor.visitorId, visitor)
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
      const newMap = new Map(state.visitors)
      const existing = newMap.get(visitorId)
      if (existing) {
        newMap.set(visitorId, {
          ...existing,
          cursorX: x,
          cursorY: y,
          ...(viewportW !== undefined ? { viewportW } : {}),
          ...(viewportH !== undefined ? { viewportH } : {}),
        })
      }
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