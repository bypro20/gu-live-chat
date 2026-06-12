'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useLiveVisitorsStore, type LiveVisitor, type VisitorActivity } from '@/lib/stores/live-visitors-store'
import { useSocket } from '@/lib/hooks/use-socket'
import { connectSocket, getSocket, isSocketConnected, isSocketEnabled } from '@/lib/socket-client'
import { usePlanFeature } from '@/lib/hooks/use-plan-feature'
import { isPlatformAdminRole } from '@/lib/platform-admin-shared'
import { VisitorDetailPanel } from '@/components/visitors/visitor-detail-panel'
import { WebRTCViewer } from '@/components/visitors/webrtc-viewer'
import { formatTimeAgo } from '@/lib/visitors-utils'
import type { WebRTCConnectionState } from '@/lib/webrtc'
import { useVisitorsI18n } from '@/lib/hooks/use-visitors-i18n'
import { formatVisitorActivityLabel } from '@/lib/visitors-i18n'
import {
  Eye, Users, Search, X, Monitor, Smartphone, Tablet,
  Globe2, MousePointer2, Activity, MapPin, ChevronDown, ChevronUp,
} from 'lucide-react'

interface AdminVisitorsMonitorProps {
  variant?: 'admin' | 'dashboard'
  websiteId?: string | null
  websiteIds?: string[]
  initialVisitorId?: string | null
}

function DeviceIcon({ device }: { device?: string | null }) {
  const d = (device || '').toLowerCase()
  if (d.includes('mobile') || d.includes('iphone') || d.includes('android')) return <Smartphone className="w-3.5 h-3.5" />
  if (d.includes('tablet') || d.includes('ipad')) return <Tablet className="w-3.5 h-3.5" />
  return <Monitor className="w-3.5 h-3.5" />
}

function activityLabel(a: VisitorActivity, m: ReturnType<typeof useVisitorsI18n>['monitor']): string {
  return formatVisitorActivityLabel(a, m)
}

export function AdminVisitorsMonitor({
  variant = 'admin',
  websiteId = null,
  websiteIds: websiteIdsProp = [],
  initialVisitorId = null,
}: AdminVisitorsMonitorProps = {}) {
  const isDashboard = variant === 'dashboard'
  const agentLabel = isDashboard ? 'dashboard' : 'admin'
  const { monitor: m, locale } = useVisitorsI18n()
  const { data: session } = useSession()
  const { allowed: overlayFeature } = usePlanFeature('overlayAI')
  const {
    visitors,
    activities,
    selectedVisitorId,
    loading,
    setVisitors,
    addVisitor,
    updateVisitor,
    removeVisitor,
    updateCursor,
    updateScreenshot,
    addActivity,
    selectVisitor,
    setLoading,
  } = useLiveVisitorsStore()

  const { on, emit } = useSocket()
  const [searchQuery, setSearchQuery] = useState('')
  const [adminWebsiteIds, setAdminWebsiteIds] = useState<string[]>([])
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [overlayEnabled, setOverlayEnabled] = useState(isDashboard ? false : true)
  const [overlayDeniedMessage, setOverlayDeniedMessage] = useState<string | null>(null)
  const [screenCapturingId, setScreenCapturingId] = useState<string | null>(null)
  const [webrtcStream, setWebrtcStream] = useState<MediaStream | null>(null)
  const [webrtcState, setWebrtcState] = useState<WebRTCConnectionState | 'idle' | 'denied'>('idle')
  const [privacyMode, setPrivacyMode] = useState(false)
  const [liveConnected, setLiveConnected] = useState(false)
  const selectedVisitorIdRef = useRef<string | null>(selectedVisitorId)
  const screenCaptureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => { selectedVisitorIdRef.current = selectedVisitorId }, [selectedVisitorId])

  const websiteIds = isDashboard ? websiteIdsProp : adminWebsiteIds

  const selectedVisitor = selectedVisitorId ? visitors.get(selectedVisitorId) : null
  const visitorActivities = activities.filter((a) => a.visitorId === selectedVisitorId)
  const recentClicks = visitorActivities
    .filter((a) => a.eventType === 'click' && a.x != null && a.y != null)
    .map((a) => ({ x: a.x!, y: a.y!, timestamp: a.timestamp }))
    .slice(0, 5)

  const fetchLiveVisitors = useCallback(async () => {
    if (!session?.user) return
    try {
      setLoading(true)
      const url = isDashboard
        ? `/api/visitors/live${websiteId ? `?websiteId=${encodeURIComponent(websiteId)}` : ''}`
        : '/api/admin/visitors/live'
      const res = await fetch(url)
      if (isDashboard && res.status === 403) {
        const data = await res.json()
        if (data.upgradeRequired) {
          setUpgradeRequired(true)
          return
        }
      }
      if (!res.ok) throw new Error(m.fetchFailed)
      const data = await res.json()
      setUpgradeRequired(false)
      setVisitors(
        (data.visitors || []).map((v: LiveVisitor & { pages?: LiveVisitor['pages'] }) => ({
          ...v,
          isLive: v.isLive ?? true,
          currentPage: v.currentPage || '',
        }))
      )
      if (isDashboard) {
        setOverlayEnabled(!!data.overlayEnabled || overlayFeature || isPlatformAdminRole(session.user.role))
      } else if (data.websiteIds?.length) {
        setAdminWebsiteIds(data.websiteIds)
      }
    } catch (err) {
      console.error('[AdminVisitorsMonitor]', err)
    } finally {
      setLoading(false)
    }
  }, [session, setVisitors, setLoading, isDashboard, websiteId, overlayFeature])

  useEffect(() => {
    if (isDashboard && overlayFeature) setOverlayEnabled(true)
  }, [isDashboard, overlayFeature])

  useEffect(() => {
    if (!isSocketEnabled()) {
      setLiveConnected(false)
      return
    }
    const tick = () => setLiveConnected(isSocketConnected())
    tick()
    const id = setInterval(tick, 2000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!initialVisitorId) return
    const match = visitors.get(initialVisitorId)
    if (match) selectVisitor(initialVisitorId)
  }, [initialVisitorId, visitors, selectVisitor])

  useEffect(() => { fetchLiveVisitors() }, [fetchLiveVisitors])

  useEffect(() => {
    const interval = setInterval(fetchLiveVisitors, 15000)
    return () => clearInterval(interval)
  }, [fetchLiveVisitors])

  // Socket — admin tüm siteleri, dashboard kullanıcı kendi sitelerini dinler
  useEffect(() => {
    if (!session?.user?.id) return
    if (isDashboard && websiteIds.length === 0 && !websiteId) return

    const socket = getSocket() || connectSocket()
    const authenticate = () => {
      if (isDashboard) {
        const ids = websiteIds.length > 0 ? websiteIds : websiteId ? [websiteId] : []
        if (ids.length === 0) return
        emit('agent:auth', { userId: session.user.id, websiteIds: ids })
      } else {
        emit('agent:auth', {
          userId: session.user.id,
          websiteIds,
          scope: 'platform',
        })
      }
    }

    if (socket?.connected) authenticate()
    else socket?.on('connect', authenticate)

    const handleVisitorOnline = (data: any) => {
      addVisitor({
        visitorId: data.visitorId as string,
        name: (data.name as string) || m.anonymous,
        currentPage: (data.currentPage as string) || '',
        currentTitle: (data.currentTitle as string) || '',
        isLive: true,
        websiteId: data.websiteId as string,
        startedAt: (data.connectedAt as string) || new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      })
      addActivity({ visitorId: data.visitorId as string, eventType: 'online', timestamp: new Date().toISOString() })
    }

    const handleVisitorOffline = (data: any) => {
      updateVisitor(data.visitorId as string, { isLive: false })
      addActivity({ visitorId: data.visitorId as string, eventType: 'offline', timestamp: new Date().toISOString() })
    }

    const handleVisitorActivity = (data: any) => {
      const eventType = (data.eventType as VisitorActivity['eventType']) || (data.url ? 'pageview' : 'click')
      const pages = eventType === 'pageview' && data.url
        ? [{ title: (data.title as string) || null, url: data.url as string, viewedAt: (data.timestamp as string) || new Date().toISOString() }]
        : undefined

      updateVisitor(data.visitorId as string, {
        currentPage: (data.url as string) || undefined,
        currentTitle: (data.title as string) || undefined,
        lastActiveAt: (data.timestamp as string) || new Date().toISOString(),
        isLive: true,
        ...(pages ? { pages } : {}),
        ...(data.viewportH != null ? { viewportH: data.viewportH as number } : {}),
        ...(data.documentH != null ? { documentH: data.documentH as number } : {}),
      })
      addActivity({
        visitorId: data.visitorId as string,
        eventType,
        url: data.url as string | undefined,
        title: data.title as string | undefined,
        selector: data.selector as string | undefined,
        x: data.x as number | undefined,
        y: data.y as number | undefined,
        scrollPercentage: data.scrollPercentage as number | undefined,
        timestamp: (data.timestamp as string) || new Date().toISOString(),
      })
    }

    const handleVisitorCursor = (data: any) => {
      updateCursor(
        data.visitorId as string,
        data.x as number,
        data.y as number,
        data.viewportW as number | undefined,
        data.viewportH as number | undefined
      )
    }

    const handleVisitorScreenshot = (data: any) => {
      if (!data.screenshot) return
      if (screenCaptureTimeoutRef.current) {
        clearTimeout(screenCaptureTimeoutRef.current)
        screenCaptureTimeoutRef.current = null
      }
      updateScreenshot(
        data.visitorId as string,
        data.screenshot as string,
        (data.timestamp as string) || undefined,
        {
          ...(data.viewportW != null ? { viewportW: data.viewportW as number } : {}),
          ...(data.viewportH != null ? { viewportH: data.viewportH as number } : {}),
          ...(data.scrollY != null ? { scrollY: data.scrollY as number } : {}),
        }
      )
    }

    const handlePrivacyMode = (data: any) => {
      if (selectedVisitorIdRef.current && data.visitorId === selectedVisitorIdRef.current) {
        setPrivacyMode(!!data.enabled)
      }
    }

    const handleOverlayDenied = (data: any) => {
      setScreenCapturingId(null)
      setWebrtcStream(null)
      setWebrtcState('idle')
      setOverlayDeniedMessage(data.message || m.overlayDenied)
    }

    const handleScreenError = (data: any) => {
      if (selectedVisitorIdRef.current && data.visitorId !== selectedVisitorIdRef.current) return
      if (screenCaptureTimeoutRef.current) {
        clearTimeout(screenCaptureTimeoutRef.current)
        screenCaptureTimeoutRef.current = null
      }
      setScreenCapturingId(null)
      setOverlayDeniedMessage(data.message || m.screenCaptureFailed)
    }

    const unsubs = [
      on('agent:visitor:online', handleVisitorOnline),
      on('agent:visitor:offline', handleVisitorOffline),
      on('agent:visitor:activity', handleVisitorActivity),
      on('agent:visitor:cursor', handleVisitorCursor),
      on('agent:visitor:screenshot', handleVisitorScreenshot),
      on('agent:visitor:privacy-mode', handlePrivacyMode),
      on('agent:overlay:denied', handleOverlayDenied),
      on('agent:screen:error', handleScreenError),
    ]

    return () => {
      socket?.off('connect', authenticate)
      unsubs.forEach((u) => u())
    }
  }, [session, websiteIds, websiteId, emit, on, addVisitor, updateVisitor, removeVisitor, updateCursor, updateScreenshot, addActivity, isDashboard, m])

  const authenticateAgent = useCallback(() => {
    if (!session?.user?.id) return
    if (isDashboard) {
      const ids = websiteIds.length > 0 ? websiteIds : websiteId ? [websiteId] : []
      if (ids.length === 0) return
      emit('agent:auth', { userId: session.user.id, websiteIds: ids })
    } else {
      emit('agent:auth', {
        userId: session.user.id,
        websiteIds,
        scope: 'platform',
      })
    }
  }, [session, websiteIds, websiteId, isDashboard, emit])

  const handleScreenCaptureToggle = useCallback((visitorId: string, active: boolean) => {
    if (active && !isSocketEnabled()) {
      setOverlayDeniedMessage(m.socketOffline)
      return
    }
    if (active && !liveConnected) {
      authenticateAgent()
      setOverlayDeniedMessage(m.socketConnecting)
    }
    if (active && isDashboard && !overlayEnabled) {
      setOverlayDeniedMessage(m.overlayDeniedPro)
      return
    }
    const visitor = visitors.get(visitorId)
    const targetWebsiteId = visitor?.websiteId || websiteId || undefined
    if (!targetWebsiteId) return
    if (active) {
      authenticateAgent()
      if (!visitor?.isLive) {
        setOverlayDeniedMessage(m.visitorNotLive)
      } else {
        setOverlayDeniedMessage(null)
      }
      setScreenCapturingId(visitorId)
      setWebrtcStream(null)
      setWebrtcState('idle')
      setPrivacyMode(false)
      emit('agent:screen:start', { visitorId, websiteId: targetWebsiteId })
      if (screenCaptureTimeoutRef.current) clearTimeout(screenCaptureTimeoutRef.current)
      screenCaptureTimeoutRef.current = setTimeout(() => {
        setScreenCapturingId((current) => {
          if (current === visitorId) {
            setOverlayDeniedMessage(m.screenCaptureFailed)
            return null
          }
          return current
        })
      }, 20000)
    } else {
      if (screenCaptureTimeoutRef.current) {
        clearTimeout(screenCaptureTimeoutRef.current)
        screenCaptureTimeoutRef.current = null
      }
      setScreenCapturingId(null)
      setWebrtcStream(null)
      setWebrtcState('idle')
      setPrivacyMode(false)
      emit('webrtc:stop', { visitorId, websiteId: targetWebsiteId, agentId: session?.user?.id || agentLabel })
      emit('agent:screen:stop', { visitorId, websiteId: targetWebsiteId })
      updateVisitor(visitorId, { screenshotUrl: null, screenshotAt: null })
    }
  }, [emit, visitors, updateVisitor, session, isDashboard, overlayEnabled, websiteId, agentLabel, authenticateAgent, m, liveConnected])

  const handleWebRTCHDToggle = useCallback((visitorId: string, active: boolean) => {
    if (active && isDashboard && !overlayEnabled) {
      setOverlayDeniedMessage(m.hdDeniedPro)
      return
    }
    const visitor = visitors.get(visitorId)
    const targetWebsiteId = visitor?.websiteId || websiteId || undefined
    if (!targetWebsiteId) return
    if (active) {
      setWebrtcState('connecting')
      setWebrtcStream(null)
      emit('webrtc:start', { visitorId, websiteId: targetWebsiteId, agentId: session?.user?.id || agentLabel })
    } else {
      setWebrtcStream(null)
      setWebrtcState('idle')
      emit('webrtc:stop', { visitorId, websiteId: targetWebsiteId, agentId: session?.user?.id || agentLabel })
    }
  }, [emit, visitors, session, isDashboard, overlayEnabled, websiteId, agentLabel])

  useEffect(() => { setPrivacyMode(false) }, [selectedVisitorId])
  useEffect(() => { setOverlayDeniedMessage(null) }, [overlayEnabled, websiteId])
  useEffect(() => {
    return () => {
      if (screenCaptureTimeoutRef.current) clearTimeout(screenCaptureTimeoutRef.current)
    }
  }, [])

  const socketReady = isSocketEnabled() && liveConnected

  const filtered = Array.from(visitors.values())
    .filter((v) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        (v.name || '').toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q) ||
        (v.country || '').toLowerCase().includes(q) ||
        (v.city || '').toLowerCase().includes(q) ||
        v.currentPage.toLowerCase().includes(q) ||
        (v.websiteName || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const at = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0
      const bt = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0
      return bt - at
    })

  const geoVisitors = filtered.filter((v) => v.latitude != null && v.longitude != null)

  if (upgradeRequired) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Eye className="w-10 h-10 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{m.upgradeTitle}</h2>
          <p className="text-gray-400 mb-4 text-sm">
            {m.upgradeDesc}
          </p>
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:opacity-90"
          >
            {m.upgradeCta}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-4 min-h-[560px] ${isDashboard ? 'flex-1 h-full min-h-0' : ''}`}>
      {!socketReady && (
        <div className="w-full px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 shrink-0">
          {m.socketOffline}
        </div>
      )}
      <div className={`flex flex-col xl:flex-row gap-4 flex-1 min-h-0 ${isDashboard ? '' : ''}`}>
      {/* Sol: liste + aktivite */}
      <div className={`w-full xl:w-[400px] shrink-0 flex flex-col bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden min-h-[480px] ${selectedVisitor ? 'hidden xl:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              {m.liveVisitors}
              <span className="text-xs font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full tabular-nums">{filtered.length}</span>
            </h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder={m.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-white/[0.04]">
          {loading && filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
              {m.noActiveVisitors}
            </div>
          ) : (
            filtered.map((visitor) => {
              const expanded = selectedVisitorId === visitor.visitorId
              return (
                <div key={visitor.visitorId}>
                  <button
                    onClick={() => selectVisitor(expanded ? null : visitor.visitorId)}
                    className={`w-full text-left p-3.5 hover:bg-white/[0.03] transition-colors ${expanded ? 'bg-white/[0.04]' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${visitor.isLive ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gray-600'}`}>
                          {(visitor.name || 'A')[0].toUpperCase()}
                        </div>
                        {visitor.isLive && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#080C14] rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white truncate">{visitor.name || m.anonymous}</p>
                          <span className="text-[10px] text-gray-500 shrink-0">{visitor.lastActiveAt ? formatTimeAgo(visitor.lastActiveAt, locale) : ''}</span>
                        </div>
                        <p className="text-[11px] text-violet-300 truncate mt-0.5 flex items-center gap-1">
                          <MousePointer2 className="w-3 h-3 shrink-0" />
                          {visitor.currentTitle || visitor.currentPage || '—'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-gray-500">
                          <DeviceIcon device={visitor.device} />
                          {visitor.websiteName && <span className="text-violet-400/80">{visitor.websiteName}</span>}
                          {visitor.city && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />{visitor.city}{visitor.country ? `, ${visitor.country}` : ''}
                            </span>
                          )}
                        </div>
                        {visitor.pages && visitor.pages.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {visitor.pages.slice(0, 3).map((p, i) => (
                              <div key={i} className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-violet-400/60 shrink-0" />
                                {p.title || p.url}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
                    </div>
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Konum özeti */}
        {geoVisitors.length > 0 && (
          <div className="p-3 border-t border-white/[0.06] shrink-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Globe2 className="w-3 h-3" /> {m.liveLocation(geoVisitors.length)}
            </p>
            <div className="relative w-full aspect-[2/1] bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden">
              {geoVisitors.map((v) => {
                const x = ((v.longitude! + 180) / 360) * 100
                const y = ((90 - v.latitude!) / 180) * 100
                return (
                  <div
                    key={v.visitorId}
                    className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    title={`${v.name || m.anonymous} — ${v.city || v.country || ''}`}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Aktivite akışı */}
        {selectedVisitorId && visitorActivities.length > 0 && (
          <div className="p-3 border-t border-white/[0.06] max-h-36 overflow-y-auto shrink-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Activity className="w-3 h-3" /> {m.movements}
            </p>
            <div className="space-y-1">
              {visitorActivities.slice(0, 12).map((a, i) => (
                <div key={i} className="text-[10px] text-gray-400 flex justify-between gap-2">
                  <span className="truncate">{activityLabel(a, m)}</span>
                  <span className="text-gray-600 shrink-0">{formatTimeAgo(a.timestamp, locale)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sağ: ekran izleme */}
      <div className={`flex-1 flex flex-col min-h-[480px] bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden ${selectedVisitor ? 'flex' : 'hidden xl:flex'}`}>
        {selectedVisitor && (
          <button
            onClick={() => selectVisitor(null)}
            className="xl:hidden flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 border-b border-white/[0.06] shrink-0"
          >
            {m.backToList}
          </button>
        )}
        <div className="flex-1 min-h-0 p-2 flex flex-col">
          {selectedVisitor ? (
            <>
              {screenCapturingId === selectedVisitorId && (
                <WebRTCViewer
                  visitorId={selectedVisitorId || ''}
                  websiteId={selectedVisitor.websiteId || websiteId || ''}
                  agentId={session?.user?.id || agentLabel}
                  onStreamReady={(s) => { setWebrtcStream(s); setWebrtcState('connected') }}
                  onDenied={() => setWebrtcState('denied')}
                  onStopped={() => { setWebrtcStream(null); setWebrtcState('idle') }}
                  onStateChange={setWebrtcState}
                />
              )}
              <div className="flex-1 min-h-0">
                <VisitorDetailPanel
                  visitor={selectedVisitor}
                  recentClicks={recentClicks}
                  activities={visitorActivities}
                  theme="admin"
                  onScreenCaptureToggle={handleScreenCaptureToggle}
                  isScreenCapturing={screenCapturingId === selectedVisitorId}
                  webrtcStream={webrtcStream}
                  webrtcState={webrtcState}
                  privacyMode={privacyMode}
                  onWebRTCHDToggle={handleWebRTCHDToggle}
                />
              </div>
              {overlayDeniedMessage && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 shrink-0">
                  {overlayDeniedMessage}
                  {isDashboard && !overlayEnabled && (
                    <>
                      {' '}
                      <Link href="/settings/plans?plan=PRO" className="font-semibold underline">{m.upgradePlanLink}</Link>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-center px-6">
              <div>
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Eye className="w-10 h-10 text-violet-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{m.screenWatchTitle}</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  {m.screenWatchDesc}
                </p>
                {filtered.length > 0 && (
                  <p className="text-xs text-emerald-400 mt-3 font-medium">{m.visitorsOnline(filtered.filter((v) => v.isLive).length)}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
