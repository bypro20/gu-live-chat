'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useLiveVisitorsStore, type LiveVisitor, type VisitorActivity } from '@/lib/stores/live-visitors-store'
import { useSocket } from '@/lib/hooks/use-socket'
import { VisitorDetailPanel } from '@/components/visitors/visitor-detail-panel'
import { WebRTCViewer } from '@/components/visitors/webrtc-viewer'
import { formatTimeAgo, formatDuration } from '@/lib/visitors-utils'
import type { WebRTCConnectionState } from '@/lib/webrtc'

function BrowserIcon({ browser }: { browser?: string | null }) {
  const b = (browser || '').toLowerCase()
  if (b.includes('chrome')) return <span title="Chrome" className="text-base">🌐</span>
  if (b.includes('firefox')) return <span title="Firefox" className="text-base">🦊</span>
  if (b.includes('safari')) return <span title="Safari" className="text-base">🧭</span>
  if (b.includes('edge')) return <span title="Edge" className="text-base">🔵</span>
  return <span title={browser || 'Bilinmiyor'} className="text-base">💻</span>
}

function DeviceIcon({ device }: { device?: string | null }) {
  const d = (device || '').toLowerCase()
  if (d.includes('mobile') || d.includes('iphone') || d.includes('android')) return <span title={device || 'Mobil'} className="text-base">📱</span>
  if (d.includes('tablet') || d.includes('ipad')) return <span title={device || 'Tablet'} className="text-base">📋</span>
  return <span title={device || 'Masaüstü'} className="text-base">🖥️</span>
}

export default function AdminVisitorsPage() {
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
    addActivity,
    selectVisitor,
    setLoading,
    setError,
  } = useLiveVisitorsStore()

  const { on, emit } = useSocket()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterWebsite, setFilterWebsite] = useState<string>('all')
  const [websites, setWebsites] = useState<{ id: string; websiteId: string; name: string }[]>([])
  const [screenCapturingId, setScreenCapturingId] = useState<string | null>(null)
  const [webrtcStream, setWebrtcStream] = useState<MediaStream | null>(null)
  const [webrtcState, setWebrtcState] = useState<WebRTCConnectionState | 'idle' | 'denied'>('idle')
  const [privacyMode, setPrivacyMode] = useState(false)

  // Ref for selectedVisitorId so socket handlers don't need to re-register on every selection change
  const selectedVisitorIdRef = useRef<string | null>(selectedVisitorId)
  useEffect(() => { selectedVisitorIdRef.current = selectedVisitorId }, [selectedVisitorId])

  const selectedVisitor = selectedVisitorId ? visitors.get(selectedVisitorId) : null
  const visitorActivities = activities.filter((a) => a.visitorId === selectedVisitorId)

  // Track recent clicks for overlay
  const recentClicks = activities
    .filter((a) => a.visitorId === selectedVisitorId && a.eventType === 'click' && a.x !== undefined && a.y !== undefined)
    .map((a) => ({ x: a.x!, y: a.y!, timestamp: a.timestamp }))
    .slice(0, 5)

  // Fetch live visitors (admin endpoint)
  const fetchLiveVisitors = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const url = filterWebsite !== 'all'
        ? `/api/admin/visitors/live?websiteId=${filterWebsite}`
        : '/api/admin/visitors/live'
      const res = await fetch(url)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Ziyaretçiler alınamadı')
      }
      const data = await res.json()
      setVisitors(data.visitors || [])
    } catch (err: any) {
      console.error('[AdminVisitors] fetchLiveVisitors error:', err)
      setError(err.message || 'Ziyaretçiler alınamadı')
    } finally {
      setLoading(false)
    }
  }, [filterWebsite, setVisitors, setLoading, setError])

  // Fetch websites for filter and socket auth
  useEffect(() => {
    async function fetchWebsites() {
      try {
        const res = await fetch('/api/admin/websites')
        if (res.ok) {
          const data = await res.json()
          const siteList = Array.isArray(data) ? data : (data.websites || [])
          setWebsites(siteList.slice(0, 50))
        }
      } catch (err) {
        console.error('[AdminVisitors] Failed to fetch websites:', err)
      }
    }
    fetchWebsites()
  }, [])

  useEffect(() => {
    fetchLiveVisitors()
  }, [fetchLiveVisitors])

  // Re-emit socket auth when websites list changes
  useEffect(() => {
    if (websites.length > 0) {
      const allWebsiteIds = websites.map(w => w.websiteId)
      emit('agent:auth', { userId: 'admin', websiteIds: allWebsiteIds })
    }
  }, [websites, emit])

  // Socket.io real-time updates
  useEffect(() => {
    const handleVisitorOnline = (data: any) => {
      addVisitor({
        visitorId: data.visitorId,
        name: data.name || 'Anonim',
        currentPage: data.currentPage || '',
        currentTitle: data.currentTitle || '',
        isLive: true,
        startedAt: data.connectedAt || new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        websiteId: data.websiteId,
      })
      addActivity({
        visitorId: data.visitorId,
        eventType: 'online',
        timestamp: new Date().toISOString(),
      })
    }

    const handleVisitorOffline = (data: any) => {
      removeVisitor(data.visitorId)
      addActivity({
        visitorId: data.visitorId,
        eventType: 'offline',
        timestamp: new Date().toISOString(),
      })
    }

    const handleVisitorActivity = (data: any) => {
      const eventType = data.eventType || (data.url ? 'pageview' : 'click')
      updateVisitor(data.visitorId, {
        currentPage: data.url || undefined,
        currentTitle: data.title || undefined,
        lastActiveAt: data.timestamp || new Date().toISOString(),
        // Also update scroll/viewport data from activity events
        // Use != null checks instead of truthy — scrollY=0 and scrollPercentage=0 are valid values
        ...(data.viewportH != null ? { viewportH: data.viewportH } : {}),
        ...(data.documentH != null ? { documentH: data.documentH } : {}),
        ...(data.scrollPercentage != null ? { scrollY: Math.round((data.scrollPercentage / 100) * (data.documentH || 1)) } : {}),
      })
      addActivity({
        visitorId: data.visitorId,
        eventType,
        url: data.url,
        title: data.title,
        selector: data.selector,
        text: data.text,
        fieldName: data.fieldName,
        fieldType: data.fieldType,
        x: data.x,
        y: data.y,
        scrollPercentage: data.scrollPercentage,
        viewportH: data.viewportH,
        documentH: data.documentH,
        timestamp: data.timestamp || new Date().toISOString(),
      })
    }

    // Handle real-time cursor position updates
    const handleVisitorCursor = (data: any) => {
      updateCursor(data.visitorId, data.x, data.y, data.viewportW, data.viewportH)
    }

    // Handle real-time screenshot updates for screen monitoring
    let screenshotCount = 0
    const handleVisitorScreenshot = (data: any) => {
      if (!data.screenshot) return
      screenshotCount++
      if (screenshotCount % 10 === 1) {
        console.log(`[AdminVisitors] Screenshot #${screenshotCount} received, size: ${Math.round(data.screenshot.length / 1024)}KB, visitor: ${data.visitorId?.substring(0, 8)}..., privacy: ${!!data.privacyMode}`)
      }
      updateVisitor(data.visitorId, {
        screenshotUrl: data.screenshot,
        screenshotAt: data.timestamp || new Date().toISOString(),
        // Use != null checks instead of truthy — scrollY=0 is a valid value (page at top)
        ...(data.viewportW != null ? { viewportW: data.viewportW } : {}),
        ...(data.viewportH != null ? { viewportH: data.viewportH } : {}),
        ...(data.scrollY != null ? { scrollY: data.scrollY } : {}),
        ...(data.documentH != null ? { documentH: data.documentH } : {}),
      })
    }

    // Handle privacy mode from visitor (password/card input focus)
    // Uses ref so the handler doesn't depend on selectedVisitorId, avoiding
    // costly re-registration of ALL socket handlers on every visitor selection change
    const handlePrivacyMode = (data: any) => {
      if (selectedVisitorIdRef.current && data.visitorId === selectedVisitorIdRef.current) {
        setPrivacyMode(data.enabled)
      }
    }

    const unsubOnline = on('agent:visitor:online', handleVisitorOnline)
    const unsubOffline = on('agent:visitor:offline', handleVisitorOffline)
    const unsubActivity = on('agent:visitor:activity', handleVisitorActivity)
    const unsubCursor = on('agent:visitor:cursor', handleVisitorCursor)
    const unsubScreenshot = on('agent:visitor:screenshot', handleVisitorScreenshot)
    const unsubPrivacyMode = on('agent:visitor:privacy-mode', handlePrivacyMode)

    return () => {
      unsubOnline()
      unsubOffline()
      unsubActivity()
      unsubCursor()
      unsubScreenshot()
      unsubPrivacyMode()
    }
  }, [on, emit, addVisitor, removeVisitor, updateVisitor, updateCursor, addActivity])

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchLiveVisitors, 30000)
    return () => clearInterval(interval)
  }, [fetchLiveVisitors])

  // Reset privacy mode when switching visitors
  useEffect(() => { setPrivacyMode(false) }, [selectedVisitorId])

  // Screen capture toggle — starts screenshot monitoring immediately (no permission needed).
  // WebRTC HD mode is available separately but requires visitor permission.
  const handleScreenCaptureToggle = useCallback((visitorId: string, active: boolean) => {
    const visitor = visitors.get(visitorId)
    const websiteId = visitor?.websiteId || selectedVisitor?.websiteId
    if (active) {
      setScreenCapturingId(visitorId)
      setWebrtcStream(null)
      setWebrtcState('idle')
      setPrivacyMode(false)
      // Start screenshot monitoring — works without any permission prompt
      emit('agent:screen:start', { visitorId, websiteId })
    } else {
      setScreenCapturingId(null)
      setWebrtcStream(null)
      setWebrtcState('idle')
      setPrivacyMode(false)
      // Stop both screenshot and WebRTC if active
      emit('webrtc:stop', { visitorId, websiteId, agentId: 'admin' })
      emit('agent:screen:stop', { visitorId, websiteId })
      updateVisitor(visitorId, { screenshotUrl: null, screenshotAt: null })
    }
  }, [emit, visitors, selectedVisitor, updateVisitor])

  // WebRTC HD mode toggle — switch between HD (WebRTC) and SD (screenshot) modes.
  // active=true → upgrade to HD (shows permission prompt on visitor side)
  // active=false → downgrade to SD (screenshot monitoring continues, no stop)
  const handleWebRTCHDToggle = useCallback((visitorId: string, active: boolean) => {
    const visitor = visitors.get(visitorId)
    const websiteId = visitor?.websiteId || selectedVisitor?.websiteId
    if (active) {
      // Upgrade to HD mode
      setWebrtcState('connecting')
      setWebrtcStream(null)
      emit('webrtc:start', { visitorId, websiteId, agentId: 'admin' })
    } else {
      // Downgrade to SD mode — stop WebRTC but keep screenshot monitoring going
      setWebrtcStream(null)
      setWebrtcState('idle')
      emit('webrtc:stop', { visitorId, websiteId, agentId: 'admin' })
      // Screenshot monitoring stays active (screenCapturingId is still set)
    }
  }, [emit, visitors, selectedVisitor])

  // WebRTC callbacks
  const handleWebrtcStreamReady = useCallback((stream: MediaStream) => {
    setWebrtcStream(stream)
    setWebrtcState('connected')
  }, [])

  const handleWebrtcDenied = useCallback(() => {
    setWebrtcState('denied')
  }, [])

  const handleWebrtcStopped = useCallback(() => {
    setWebrtcStream(null)
    setWebrtcState('idle')
  }, [])

  const handleWebrtcStateChange = useCallback((state: WebRTCConnectionState) => {
    setWebrtcState(state)
  }, [])

  // Filter visitors
  const filteredVisitors = Array.from(visitors.values()).filter((v) => {
    const matchesSearch =
      !searchQuery ||
      (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.currentPage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.websiteName || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesWebsite = filterWebsite === 'all' || v.websiteId === filterWebsite

    return matchesSearch && matchesWebsite
  })

  filteredVisitors.sort((a, b) => {
    const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0
    const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0
    return bTime - aTime
  })

  return (
    <div className="h-screen bg-[#0d0d1a] p-4 lg:p-6 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Ekran İzleme</h1>
          <p className="text-gray-400 text-sm mt-1">Tüm sitelerdeki ziyaretçileri gerçek zamanlı izleyin</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-emerald-400">{visitors.size} çevrimiçi</span>
          </span>
          <button
            onClick={fetchLiveVisitors}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all border border-white/10"
          >
            Yenile
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="İsim, email, sayfa veya site ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all"
          />
        </div>
        <select
          value={filterWebsite}
          onChange={(e) => setFilterWebsite(e.target.value)}
          className="px-4 py-2.5 text-sm rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50"
        >
          <option value="all">Tüm Siteler</option>
          {websites.map((w) => (
            <option key={w.websiteId} value={w.websiteId} className="bg-[#1A1D2E]">
              {w.name || w.websiteId}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content — flex-1 to fill remaining vertical space */}
      <div className="flex gap-6 flex-1 min-h-0 mt-4 lg:mt-6">
        {/* Visitor List */}
        <div className="w-[380px] shrink-0 rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Ziyaretçiler</span>
            <span className="text-xs text-gray-500">{filteredVisitors.length} sonuç</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && visitors.size === 0 ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredVisitors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center px-6">
                <span className="text-4xl mb-3">👁️</span>
                <p className="text-sm font-medium text-gray-300">Ziyaretçi bulunamadı</p>
                <p className="text-xs text-gray-500 mt-1">Şu anda aktif ziyaretçi yok</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredVisitors.map((visitor) => (
                  <button
                    key={visitor.visitorId}
                    onClick={() => selectVisitor(visitor.visitorId)}
                    className={`w-full text-left p-3.5 hover:bg-white/5 transition-all ${
                      selectedVisitorId === visitor.visitorId
                        ? 'bg-red-500/10 border-l-2 border-l-red-500'
                        : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {(visitor.name || 'A')[0].toUpperCase()}
                        </div>
                        {visitor.isLive && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#1A1D2E] rounded-full">
                            <div className="w-full h-full bg-emerald-500 rounded-full animate-ping opacity-75" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white truncate">
                            {visitor.name || 'Anonim'}
                          </p>
                          <span className="text-[10px] text-gray-500 shrink-0">
                            {visitor.lastActiveAt ? formatTimeAgo(visitor.lastActiveAt) : ''}
                          </span>
                        </div>

                        <p className="text-xs text-red-400 truncate mt-0.5" title={visitor.currentTitle || visitor.currentPage}>
                          {visitor.currentTitle || visitor.currentPage || '—'}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1">
                          <BrowserIcon browser={visitor.browser} />
                          <DeviceIcon device={visitor.device} />
                          {visitor.websiteName && (
                            <span className="text-[10px] text-gray-500 truncate ml-1">{visitor.websiteName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Visitor Detail — full-height viewer, no padding/scroll that would shrink it */}
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex flex-col">
          {selectedVisitor ? (
            <div className="flex-1 min-h-0 p-0 relative">
              {/* WebRTC viewer — manages peer connection, renders nothing visible */}
              {screenCapturingId === selectedVisitorId && selectedVisitor && (
                <WebRTCViewer
                  visitorId={selectedVisitorId || ''}
                  websiteId={selectedVisitor?.websiteId || ''}
                  agentId="admin"
                  onStreamReady={handleWebrtcStreamReady}
                  onDenied={handleWebrtcDenied}
                  onStopped={handleWebrtcStopped}
                  onStateChange={handleWebrtcStateChange}
                />
              )}
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
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Ekran İzleme</h3>
                <p className="text-sm text-gray-400 max-w-sm">
                  Soldaki listeden bir ziyaretçi seçerek gerçek zamanlı aktivitelerini izleyebilirsiniz.
                </p>
                {visitors.size > 0 && (
                  <p className="text-xs text-emerald-400 mt-3 font-medium">
                    ● Şu anda {visitors.size} ziyaretçi çevrimiçi
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
