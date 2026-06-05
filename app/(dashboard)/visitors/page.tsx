'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useLiveVisitorsStore, type LiveVisitor, type VisitorActivity } from '@/lib/stores/live-visitors-store'
import { useSocket } from '@/lib/hooks/use-socket'
import { VisitorDetailPanel } from '@/components/visitors/visitor-detail-panel'
import { WebRTCViewer } from '@/components/visitors/webrtc-viewer'
import { formatTimeAgo, formatDuration } from '@/lib/visitors-utils'
import type { WebRTCConnectionState } from '@/lib/webrtc'

// ─── Browser/OS/Device icons ────────────────────────────────────────
function BrowserIcon({ browser }: { browser?: string | null }) {
  const b = (browser || '').toLowerCase()
  if (b.includes('chrome')) return <span title="Chrome" className="text-lg">🌐</span>
  if (b.includes('firefox')) return <span title="Firefox" className="text-lg">🦊</span>
  if (b.includes('safari')) return <span title="Safari" className="text-lg">🧭</span>
  if (b.includes('edge')) return <span title="Edge" className="text-lg">🔵</span>
  if (b.includes('opera')) return <span title="Opera" className="text-lg">🔴</span>
  return <span title={browser || 'Bilinmiyor'} className="text-lg">💻</span>
}

function DeviceIcon({ device }: { device?: string | null }) {
  const d = (device || '').toLowerCase()
  if (d.includes('mobile') || d.includes('iphone') || d.includes('android')) return <span title={device || 'Mobil'} className="text-lg">📱</span>
  if (d.includes('tablet') || d.includes('ipad')) return <span title={device || 'Tablet'} className="text-lg">📋</span>
  return <span title={device || 'Masaüstü'} className="text-lg">🖥️</span>
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function VisitorsPage() {
  const { data: session } = useSession()
  const {
    visitors,
    activities,
    selectedVisitorId,
    loading,
    error,
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
  const [filterDevice, setFilterDevice] = useState<string>('all')
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [userWebsiteIds, setUserWebsiteIds] = useState<string[]>([])
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

  // Fetch initial live visitors and user's website IDs
  const fetchLiveVisitors = useCallback(async () => {
    if (!session?.user) return
    try {
      setLoading(true)
      const res = await fetch('/api/visitors/live')
      if (res.status === 403) {
        const data = await res.json()
        if (data.upgradeRequired) {
          setUpgradeRequired(true)
          setLoading(false)
          return
        }
      }
      if (!res.ok) throw new Error('Ziyaretçiler alınamadı')
      const data = await res.json()
      setVisitors(data.visitors || [])
      // Extract website IDs for socket auth
      if (data.visitors?.length > 0) {
        const ids = [...new Set(data.visitors.map((v: any) => v.websiteId).filter(Boolean))] as string[]
        if (ids.length > 0) setUserWebsiteIds(ids)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [session, setVisitors, setLoading, setError])

  // Fetch user's websites for socket auth
  useEffect(() => {
    if (!session?.user || userWebsiteIds.length > 0) return
    fetch('/api/websites')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.websites) {
          setUserWebsiteIds(data.websites.map((w: any) => w.websiteId))
        }
      })
      .catch(() => {})
  }, [session, userWebsiteIds.length])

  useEffect(() => {
    fetchLiveVisitors()
  }, [fetchLiveVisitors])

  // Socket.io real-time updates
  useEffect(() => {
    if (!session?.user || userWebsiteIds.length === 0) return

    // Authenticate as agent with user's website IDs
    emit('agent:auth', { userId: session.user.id, websiteIds: userWebsiteIds })

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
        // Use != null checks — scrollY=0 and scrollPercentage=0 are valid values
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
        console.log(`[VisitorsPage] Screenshot #${screenshotCount} received, size: ${Math.round(data.screenshot.length / 1024)}KB, visitor: ${data.visitorId?.substring(0, 8)}...`)
      }
      updateVisitor(data.visitorId, {
        screenshotUrl: data.screenshot,
        screenshotAt: data.timestamp || new Date().toISOString(),
        // Use != null checks — scrollY=0 is a valid value (page at top)
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
  }, [session, on, emit, addVisitor, removeVisitor, updateVisitor, updateCursor, addActivity, userWebsiteIds])

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
      emit('webrtc:stop', { visitorId, websiteId, agentId: session?.user?.id || 'dashboard' })
      emit('agent:screen:stop', { visitorId, websiteId })
      updateVisitor(visitorId, { screenshotUrl: null, screenshotAt: null })
    }
  }, [emit, visitors, selectedVisitor, updateVisitor, session])

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
      emit('webrtc:start', { visitorId, websiteId, agentId: session?.user?.id || 'dashboard' })
    } else {
      // Downgrade to SD mode — stop WebRTC but keep screenshot monitoring going
      setWebrtcStream(null)
      setWebrtcState('idle')
      emit('webrtc:stop', { visitorId, websiteId, agentId: session?.user?.id || 'dashboard' })
      // Screenshot monitoring stays active (screenCapturingId is still set)
    }
  }, [emit, visitors, selectedVisitor, session])

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

  // Auto-refresh every 30 seconds as fallback
  useEffect(() => {
    const interval = setInterval(fetchLiveVisitors, 30000)
    return () => clearInterval(interval)
  }, [fetchLiveVisitors])

  // Reset privacy mode when switching visitors
  useEffect(() => { setPrivacyMode(false) }, [selectedVisitorId])

  // Filter visitors
  const filteredVisitors = Array.from(visitors.values()).filter((v) => {
    const matchesSearch =
      !searchQuery ||
      (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.currentPage.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDevice =
      filterDevice === 'all' ||
      (filterDevice === 'mobile' && (v.device || '').toLowerCase().includes('mobile')) ||
      (filterDevice === 'desktop' && !(v.device || '').toLowerCase().includes('mobile'))

    return matchesSearch && matchesDevice
  })

  // Sort by lastActiveAt (most recent first)
  filteredVisitors.sort((a, b) => {
    const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0
    const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0
    return bTime - aTime
  })

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#F8F7FC] dark:bg-[#0a0a12]">
      {upgradeRequired ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#6C3CE1]/10 to-[#EC4899]/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-[#6C3CE1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ekran İzleme</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Canlı ziyaretçi izleme, cursor takibi ve ekran önizlemesi profesyonel ve iş paketlerinde kullanılabilir.
            </p>
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#6C3CE1] to-[#EC4899] text-white font-semibold rounded-xl shadow-lg shadow-[#6C3CE1]/25 hover:shadow-[#6C3CE1]/40 transition-all hover:scale-[1.02]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Paketi Yükselt
            </Link>
          </div>
        </div>
      ) : (
      <div className="flex-1 flex flex-col lg:flex-row">
      {/* Left Panel — Visitor List */}
      <div className="w-full lg:w-[380px] xl:w-[420px] border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-[#12121f]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Ekran İzleme</h1>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm">
                {visitors.size}
              </span>
            </div>
            <button
              onClick={fetchLiveVisitors}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Yenile"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="İsim, email veya sayfa ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0a0a12] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6C3CE1]/30 focus:border-[#6C3CE1] transition-all"
            />
          </div>

          {/* Device Filter */}
          <div className="flex gap-1.5">
            {[
              { key: 'all', label: 'Tümü' },
              { key: 'desktop', label: '🖥️ Masaüstü' },
              { key: 'mobile', label: '📱 Mobil' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterDevice(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterDevice === f.key
                    ? 'bg-[#6C3CE1] text-white shadow-md shadow-[#6C3CE1]/25'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visitor List */}
        <div className="flex-1 overflow-y-auto">
          {loading && visitors.size === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-[#6C3CE1] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-6">
              <span className="text-4xl mb-3">👁️</span>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {visitors.size === 0 ? 'Henüz ziyaretçi yok' : 'Sonuç bulunamadı'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {visitors.size === 0
                  ? 'Sitenize gelen ziyaretçiler burada görünecek'
                  : 'Farklı anahtar kelimeler deneyin'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {filteredVisitors.map((visitor) => (
                <button
                  key={visitor.visitorId}
                  onClick={() => selectVisitor(visitor.visitorId)}
                  className={`w-full text-left p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all ${
                    selectedVisitorId === visitor.visitorId
                      ? 'bg-[#6C3CE1]/5 dark:bg-[#6C3CE1]/10 border-l-2 border-l-[#6C3CE1]'
                      : 'border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C3CE1] to-[#EC4899] flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {(visitor.name || 'A')[0].toUpperCase()}
                      </div>
                      {visitor.isLive && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#12121f] rounded-full">
                          <div className="w-full h-full bg-emerald-500 rounded-full animate-ping opacity-75" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {visitor.name || 'Anonim'}
                        </p>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                          {visitor.lastActiveAt ? formatTimeAgo(visitor.lastActiveAt) : ''}
                        </span>
                      </div>

                      {/* Current page */}
                      <p className="text-xs text-[#6C3CE1] dark:text-[#A78BFA] truncate mt-0.5" title={visitor.currentTitle || visitor.currentPage}>
                        {visitor.currentTitle || visitor.currentPage || '—'}
                      </p>

                      {/* Device info */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <BrowserIcon browser={visitor.browser} />
                        <DeviceIcon device={visitor.device} />
                        {visitor.country && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{visitor.country}{visitor.city ? `, ${visitor.city}` : ''}</span>
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

      {/* Right Panel — Live Screen Viewer (dominant, full height) */}
      <div className="flex-1 flex flex-col min-h-0 p-2">
        {selectedVisitor ? (
          <>
            {/* WebRTC viewer — manages peer connection */}
            {screenCapturingId === selectedVisitorId && selectedVisitor && (
              <WebRTCViewer
                visitorId={selectedVisitorId || ''}
                websiteId={selectedVisitor?.websiteId || ''}
                agentId={session?.user?.id || 'dashboard'}
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
              theme="dashboard"
              onScreenCaptureToggle={handleScreenCaptureToggle}
              isScreenCapturing={screenCapturingId === selectedVisitorId}
              webrtcStream={webrtcStream}
              webrtcState={webrtcState}
              privacyMode={privacyMode}
              onWebRTCHDToggle={handleWebRTCHDToggle}
            />
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#6C3CE1]/10 to-[#EC4899]/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#6C3CE1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Ekran İzleme
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Ziyaretçi ekranını gerçek zamanlı izleyin. Kredi kartı ve şifre gibi hassas bilgiler otomatik olarak gizlenir.
              </p>
              {visitors.size > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 font-medium">
                  ● Şu anda {visitors.size} ziyaretçi çevrimiçi
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
      )}
    </div>
  )
}