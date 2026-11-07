'use client'

import { useEffect, useRef, useState, useCallback, useLayoutEffect, useSyncExternalStore } from 'react'
import type { LiveVisitor, VisitorActivity } from '@/lib/stores/live-visitors-store'
import { getAccent, type VisitorTheme } from '@/lib/visitors-utils'
import { formatVisitorTechLine, formatVisitorLocationLine } from '@/lib/visitor-intelligence'
import { useSocket } from '@/lib/hooks/use-socket'
import { useVisitorsI18n } from '@/lib/hooks/use-visitors-i18n'
import { VisitorInspector } from '@/components/visitors/visitor-inspector'

interface OverlayPreviewProps {
  visitor: LiveVisitor
  recentClicks: Array<{ x: number; y: number; timestamp: string }>
  activities: VisitorActivity[]
  theme?: VisitorTheme
  onScreenCaptureToggle?: (visitorId: string, active: boolean) => void
  isScreenCapturing?: boolean
  webrtcStream?: MediaStream | null
  webrtcState?: 'connecting' | 'connected' | 'failed' | 'denied' | 'idle' | 'new' | 'disconnected' | 'closed'
  privacyMode?: boolean
  onWebRTCHDToggle?: (visitorId: string, active: boolean) => void
}

const WIDE_QUERY = '(min-width: 1280px)'
function subscribeWide(cb: () => void) {
  const mq = window.matchMedia(WIDE_QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export function OverlayPreview({
  visitor,
  recentClicks,
  activities,
  theme = 'dashboard',
  onScreenCaptureToggle,
  isScreenCapturing,
  webrtcStream,
  webrtcState,
  privacyMode,
  onWebRTCHDToggle,
}: OverlayPreviewProps) {
  const accent = getAccent(theme)
  const { overlay: o, monitor: m, locale } = useVisitorsI18n()
  const { emit } = useSocket()
  const videoRef = useRef<HTMLVideoElement>(null)
  const screenshotImgRef = useRef<HTMLImageElement>(null)
  const [isStopping, setIsStopping] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  // Geniş ekranda denetçi paneli açık başlar; kullanıcı değiştirirse onun tercihi geçerli.
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE_QUERY).matches, () => false)
  const [infoOverride, setInfoOverride] = useState<boolean | null>(null)
  const showInfo = infoOverride ?? wide
  const [screenshotReady, setScreenshotReady] = useState(false)
  const [remoteClicks, setRemoteClicks] = useState<Array<{ x: number; y: number; timestamp: number }>>([])
  const [interventionMode, setInterventionMode] = useState(false)
  const lastScreenshotRef = useRef<string | null>(null)
  const frameCountRef = useRef(0)
  const lastFrameAtRef = useRef(0)
  const [liveFps, setLiveFps] = useState(0)
  const frameRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<{ w: number; h: number } | null>(null)
  const { emit: socketEmit } = useSocket()

  const viewportW = visitor.viewportW || 1920
  const viewportH = visitor.viewportH || 1080

  const lastInterventionEmitRef = useRef(0)

  // Ziyaretçi ekranıyla aynı en-boy oranında sahne: siyah şerit yok, imleç/tıklama koordinatları doğru.
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const ratio = viewportW / viewportH
    const fit = () => {
      const cw = el.clientWidth
      const ch = el.clientHeight
      if (!cw || !ch) return
      const w = cw / ch > ratio ? Math.floor(ch * ratio) : cw
      const h = cw / ch > ratio ? ch : Math.floor(cw / ratio)
      setStage((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }))
    }
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewportW, viewportH])

  const hasWebRTC = !!webrtcStream
  const isConnected = hasWebRTC && webrtcState === 'connected'
  const isConnecting = !hasWebRTC && !!isScreenCapturing && !screenshotReady
  const isActive = hasWebRTC || !!isScreenCapturing

  // Intervention: mouse move — send viewport-mapped coordinates to visitor
  const handleInterventionMouseMove = useCallback((event: React.MouseEvent) => {
    if (!interventionMode || !isActive || !visitor.visitorId || !visitor.websiteId) return
    const rect = event.currentTarget.getBoundingClientRect()
    const relX = (event.clientX - rect.left) / rect.width
    const relY = (event.clientY - rect.top) / rect.height
    const mx = Math.round(relX * viewportW)
    const my = Math.round(relY * viewportH)

    const now = Date.now()
    if (now - lastInterventionEmitRef.current > 80) {
      socketEmit?.('agent:visitor:mousemove', {
        visitorId: visitor.visitorId,
        websiteId: visitor.websiteId,
        x: mx,
        y: my,
      })
      lastInterventionEmitRef.current = now
    }
  }, [interventionMode, isActive, visitor.visitorId, visitor.websiteId, viewportW, viewportH, socketEmit])

  // Intervention: scroll — send wheel delta to visitor
  const handleInterventionWheel = useCallback((event: React.WheelEvent) => {
    if (!interventionMode || !isActive || !visitor.visitorId || !visitor.websiteId) return
    socketEmit?.('agent:visitor:scroll', {
      visitorId: visitor.visitorId,
      websiteId: visitor.websiteId,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
    })
  }, [interventionMode, isActive, visitor.visitorId, visitor.websiteId, socketEmit])

  // Intervention: keyboard — capture keystrokes and send to visitor
  useEffect(() => {
    if (!interventionMode || !isActive) return
    const handleKey = (event: KeyboardEvent) => {
      if (!visitor.visitorId || !visitor.websiteId) return
      // Don't capture if the agent is typing in their own input
      const tag = (event.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      // Don't capture modifier-only keys
      const modKeys = ['Control', 'Shift', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock']
      if (modKeys.includes(event.key)) return

      const payload = {
        visitorId: visitor.visitorId,
        websiteId: visitor.websiteId,
        key: event.key,
        code: event.code,
        keyCode: event.keyCode,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
      }
      socketEmit?.('agent:visitor:keydown', payload)
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      if (!visitor.visitorId || !visitor.websiteId) return
      const tag = (event.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const modKeys = ['Control', 'Shift', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock']
      if (modKeys.includes(event.key)) return

      socketEmit?.('agent:visitor:keyup', {
        visitorId: visitor.visitorId,
        websiteId: visitor.websiteId,
        key: event.key,
        code: event.code,
        keyCode: event.keyCode,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
      })
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [interventionMode, isActive, visitor.visitorId, visitor.websiteId, socketEmit])

  const scrollPercent = viewportH && visitor.documentH && visitor.documentH > viewportH
    ? Math.min(100, Math.round(((visitor.scrollY || 0) / (visitor.documentH - viewportH)) * 100))
    : 0

  useLayoutEffect(() => {
    const img = screenshotImgRef.current
    if (!img || !visitor.screenshotUrl) return
    if (visitor.screenshotUrl === lastScreenshotRef.current) return

    lastScreenshotRef.current = visitor.screenshotUrl
    img.src = visitor.screenshotUrl

    const now = performance.now()
    if (lastFrameAtRef.current > 0) {
      const dt = now - lastFrameAtRef.current
      if (dt > 0) {
        const fps = Math.round(1000 / dt)
        setLiveFps((prev) => Math.round(prev * 0.65 + fps * 0.35))
      }
    }
    lastFrameAtRef.current = now
    frameCountRef.current += 1

    if (!screenshotReady) setScreenshotReady(true)
  }, [visitor.screenshotUrl, screenshotReady])

  useEffect(() => {
    if (!isScreenCapturing) {
      setScreenshotReady(false)
      setLiveFps(0)
      lastScreenshotRef.current = null
      lastFrameAtRef.current = 0
      frameCountRef.current = 0
      const img = screenshotImgRef.current
      if (img) img.removeAttribute('src')
    }
  }, [isScreenCapturing])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (webrtcStream) {
      if (video.srcObject !== webrtcStream) video.srcObject = webrtcStream
      if (video.paused) video.play().catch(() => {})
    } else if (video.srcObject) {
      video.srcObject = null
    }
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video || !webrtcStream) return
    const resume = () => {
      if (video.paused && webrtcStream.getVideoTracks().some((t) => t.readyState === 'live')) video.play().catch(() => {})
    }
    video.addEventListener('pause', resume)
    const interval = setInterval(resume, 2000)
    return () => { video.removeEventListener('pause', resume); clearInterval(interval) }
  }, [webrtcStream])

  useEffect(() => {
    if (!isFullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFullscreen])

  const handleStop = useCallback(() => {
    if (!onScreenCaptureToggle) return
    setIsStopping(true)
    setScreenshotReady(false)
    onScreenCaptureToggle(visitor.visitorId, false)
    setIsFullscreen(false)
    setZoom(1)
    setInterventionMode(false)
    setTimeout(() => setIsStopping(false), 2000)
  }, [onScreenCaptureToggle, visitor.visitorId])

  const handleStart = useCallback(() => {
    onScreenCaptureToggle?.(visitor.visitorId, true)
  }, [onScreenCaptureToggle, visitor.visitorId])

  const zoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.25, 4)), [])
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z / 1.25, 1)), [])
  const zoomReset = useCallback(() => setZoom(1), [])

  const displayName = visitor.name || m.anonymous
  const initial = displayName[0]?.toUpperCase() || 'A'

  const formatDurationLocal = (dateStr?: string) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return o.justNow
    if (mins < 60) return o.durationMin(mins)
    const hours = Math.floor(mins / 60)
    return o.durationHour(hours, mins % 60)
  }

  const showScreenshot = !!isScreenCapturing && !hasWebRTC && screenshotReady
  const canStartScreenWatch = Boolean(onScreenCaptureToggle)
  const recentlyActive = Boolean(
    visitor.lastActiveAt &&
    Date.now() - new Date(visitor.lastActiveAt).getTime() < 5 * 60 * 1000
  )
  const socketLive = visitor.isLive === true

  // Remote click handler — admin clicks on the screen, we send click to visitor
  const handleRemoteClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!interventionMode || !isActive || !visitor.visitorId || !visitor.websiteId) return
    if (zoom > 1) return

    const rect = e.currentTarget.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top) / rect.height
    const clickX = Math.round(relX * viewportW)
    const clickY = Math.round(relY * viewportH)

    // Visual feedback (click ripple)
    const clickTimestamp = Date.now()
    setRemoteClicks(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, timestamp: clickTimestamp }])
    setTimeout(() => {
      setRemoteClicks(prev => prev.filter(c => c.timestamp !== clickTimestamp))
    }, 2000)

    emit('agent:visitor:click', {
      visitorId: visitor.visitorId,
      websiteId: visitor.websiteId,
      x: clickX,
      y: clickY,
    })
  }, [interventionMode, isActive, visitor.visitorId, visitor.websiteId, viewportW, viewportH, zoom, emit])

  // ─── Control bar ───
  const controlBar = (
    <div className="flex items-center justify-between gap-3 px-3 h-12 shrink-0 bg-[#08111d]/90 border-b border-white/[0.07]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex shrink-0 items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {(isConnected || screenshotReady) && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${(isConnected || screenshotReady) ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-300">{(isConnected || screenshotReady) ? o.live : o.wait}</span>
        </div>
        <div className="hidden min-w-0 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.035] px-3 py-1.5 md:flex">
          <svg className="h-3 w-3 shrink-0 text-white/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          <span className="max-w-[260px] truncate font-mono text-[11px] text-white/60">{visitor.currentPage || '—'}</span>
        </div>
        <span className="hidden shrink-0 font-mono text-[11px] tabular-nums text-white/40 lg:inline">{viewportW}×{viewportH}</span>
        {scrollPercent > 0 && <span className="hidden shrink-0 font-mono text-[11px] tabular-nums text-white/40 lg:inline">↕ {scrollPercent}%</span>}
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${isConnected ? 'bg-violet-400/15 text-violet-200' : 'bg-white/[0.07] text-white/55'}`}>
          {isConnected ? (liveFps > 0 ? `HD · ${liveFps} FPS` : 'HD') : (liveFps > 0 ? `${locale === 'en' ? 'Snapshot' : 'Anlık görüntü'} · ${liveFps} FPS` : (locale === 'en' ? 'Snapshot' : 'Anlık görüntü'))}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Intervention mode toggle — cursor icon */}
        {isActive && (
          <button
            onClick={() => setInterventionMode((v) => {
              if (!v) setZoom(1)
              return !v
            })}
            title={interventionMode ? o.interventionOn : o.interventionOff}
            className={`flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[11px] font-semibold transition-all ${
              interventionMode
                ? 'bg-sky-500/30 text-sky-200 ring-1 ring-sky-400/60 shadow-sm shadow-sky-500/20'
                : 'text-white/40 hover:bg-white/[0.06] hover:text-white/70'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={interventionMode ? 2.5 : 2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 13l6 6" />
            </svg>
            {interventionMode && <span>{o.intervention}</span>}
          </button>
        )}
        {/* Visitor info toggle */}
        <button
          onClick={() => setInfoOverride(!showInfo)}
          title={o.visitorInfo}
          className={`w-8 h-8 grid place-items-center rounded-lg transition-colors ${showInfo ? 'bg-white/[0.12] text-white/90' : 'text-white/40 hover:bg-white/[0.06] hover:text-white/70'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
        {/* Zoom — disabled in intervention mode: zoomed-in clicks can't map to visitor coordinates */}
        <div className={`flex items-center gap-0.5 bg-white/[0.06] rounded-lg px-1 py-0.5 ${interventionMode ? 'opacity-40' : ''}`} title={interventionMode ? o.zoomDisabledIntervention : undefined}>
          <button onClick={zoomOut} disabled={interventionMode || zoom <= 1} title={o.zoomOut} className="w-6 h-6 grid place-items-center rounded text-white/40 hover:bg-white/[0.08] hover:text-white/70 disabled:opacity-25 disabled:hover:bg-transparent text-sm leading-none">−</button>
          <button onClick={zoomReset} disabled={interventionMode} title={o.zoomReset} className="px-1 text-[10px] font-mono text-white/35 hover:text-white/70 min-w-[36px] disabled:opacity-25">{Math.round(zoom * 100)}%</button>
          <button onClick={zoomIn} disabled={interventionMode || zoom >= 4} title={o.zoomIn} className="w-6 h-6 grid place-items-center rounded text-white/40 hover:bg-white/[0.08] hover:text-white/70 disabled:opacity-25 disabled:hover:bg-transparent text-sm leading-none">+</button>
        </div>
        {/* Fullscreen */}
        <button onClick={() => setIsFullscreen((f) => !f)} title={isFullscreen ? o.exitFullscreen : o.fullscreen} className="w-8 h-8 grid place-items-center rounded-lg text-white/40 hover:bg-white/[0.08] hover:text-white/80 transition-colors">
          {isFullscreen ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V5m0 4H5m4 0L4 4m11 5h4m-4 0V5m0 4l5-5M9 15v4m0-4H5m4 0l-5 5m11-5h4m-4 0v4m0-4l5 5" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          )}
        </button>
        {/* Stop */}
        <button onClick={handleStop} disabled={isStopping} className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[11px] font-semibold text-white bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-wait transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          {isStopping ? o.disconnecting : o.disconnect}
        </button>
      </div>
    </div>
  )

  // ─── Visitor inspector drawer (screen yanında açılır) ───
  const inspectorDrawer = isActive && (
    <div
      className={`shrink-0 overflow-hidden border-l border-white/[0.07] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${showInfo ? 'w-[340px] max-w-[85%]' : 'w-0 border-transparent'}`}
    >
      <div className="h-full w-[340px] max-w-full">
        <VisitorInspector visitor={visitor} activities={activities} onClose={() => setInfoOverride(false)} />
      </div>
    </div>
  )

  // ─── Cursor position ───
  const cursorX = visitor.cursorX
  const cursorY = visitor.cursorY
  const showCursor = isActive && cursorX !== undefined && cursorY !== undefined

  // ─── The screen surface ───
  const screen = (
    <div ref={frameRef} className="relative flex-1 min-h-0 overflow-hidden flex items-center justify-center bg-[#05040a] bg-[radial-gradient(60%_55%_at_50%_50%,rgba(124,58,237,0.16),transparent_70%)] p-0">
    <div
      className="relative shrink-0 overflow-hidden bg-black shadow-[0_20px_80px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
      onClick={handleRemoteClick}
      onMouseMove={handleInterventionMouseMove}
      onWheel={handleInterventionWheel}
      style={{
        width: stage?.w ?? '100%',
        height: stage?.h ?? '100%',
        cursor: interventionMode && isActive && zoom <= 1 ? 'crosshair' : undefined,
      }}
    >
      {/* Intervention mode banner */}
      {interventionMode && isActive && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600/95 backdrop-blur-sm text-white text-[12px] font-semibold shadow-xl shadow-sky-600/40 pointer-events-none animate-pulse">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 13l6 6" />
          </svg>
          {o.interventionBanner}
        </div>
      )}

      {/* WebRTC stream */}
      {hasWebRTC && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full block"
          style={{
            objectFit: 'fill',
            background: '#000',
            transform: zoom > 1 ? `scale(${zoom})` : undefined,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
        />
      )}

      {/* Screenshot stream */}
      {isScreenCapturing && !hasWebRTC && (
        <img
          ref={screenshotImgRef}
          alt={o.liveScreenAlt}
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full block"
          style={{
            objectFit: 'fill',
            background: '#000',
            transform: zoom > 1 ? `scale(${zoom})` : undefined,
            transformOrigin: 'center center',
            imageRendering: 'auto',
            transition: 'opacity 0.12s ease',
          }}
          draggable={false}
        />
      )}

      {/* Visitor cursor overlay */}
      {showCursor && !interventionMode && (
        <div
          className="absolute z-10 pointer-events-none"
          style={{
            left: `${((cursorX || 0) / viewportW) * 100}%`,
            top: `${((cursorY || 0) / viewportH) * 100}%`,
            transform: zoom > 1 ? `scale(${zoom})` : undefined,
            transformOrigin: 'center center',
            transition: 'left 0.08s linear, top 0.08s linear',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
            <path d="M5 3l14 8-6 2-2 6z" fill="#a78bfa" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Click ripple effects at visitor click positions */}
      {isActive && recentClicks.length > 0 && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {recentClicks.map((click, i) => {
            const age = Date.now() - new Date(click.timestamp).getTime()
            if (age > 2000) return null
            const opacity = Math.max(0, 1 - age / 2000)
            return (
              <div
                key={`${click.timestamp}-${i}`}
                className="absolute"
                style={{
                  left: `${((click.x || 0) / viewportW) * 100}%`,
                  top: `${((click.y || 0) / viewportH) * 100}%`,
                  opacity,
                }}
              >
                <div className="w-5 h-5 rounded-full bg-red-500/60 animate-ping" />
                <div className="absolute inset-0 w-5 h-5 rounded-full border-2 border-red-400" />
              </div>
            )
          })}
        </div>
      )}

      {/* Remote click feedback */}
      {remoteClicks.length > 0 && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {remoteClicks.map((click, i) => {
            const age = Date.now() - click.timestamp
            if (age > 2000) return null
            const opacity = Math.max(0, 1 - age / 2000)
            return (
              <div
                key={`rc-${click.timestamp}-${i}`}
                className="absolute"
                style={{
                  left: click.x,
                  top: click.y,
                  opacity,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="w-8 h-8 rounded-full bg-sky-500/50 animate-ping" />
                <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-sky-400" />
              </div>
            )
          })}
        </div>
      )}

      {/* Connecting spinner */}
      {isConnecting && (
        <div className="absolute inset-0 grid place-items-center bg-[#050816] z-10">
          <div className="flex flex-col items-center gap-4 text-white/60">
            <div className="w-10 h-10 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin" />
            <span className="text-sm font-medium">{o.connecting}</span>
            <span className="text-xs text-white/30">{o.waitingScreenshot}</span>
          </div>
        </div>
      )}

      {/* Denied state */}
      {!hasWebRTC && webrtcState === 'denied' && (
        <div className="absolute inset-0 grid place-items-center bg-[#050816]">
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 grid place-items-center text-2xl">🚫</div>
            <p className="text-sm font-semibold text-white/90">{o.shareDenied}</p>
            <button onClick={handleStart} className="mt-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#1972F5] to-[#2563EB] hover:opacity-90 transition-opacity">{o.retry}</button>
          </div>
        </div>
      )}

      {/* Privacy overlay */}
      {privacyMode && isActive && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#050816]/98 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-sky-500/20 grid place-items-center text-3xl">🔒</div>
            <div>
              <p className="text-lg font-bold text-white">{o.privacyHiddenTitle}</p>
              <p className="text-sm text-white/40 mt-1.5 leading-relaxed">
                {o.privacyHiddenDesc}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-amber-400 font-medium">{o.privacyResume}</span>
            </div>
          </div>
        </div>
      )}

      {/* Scroll position indicator */}
      {isActive && scrollPercent > 0 && visitor.documentH && (
        <div className="absolute right-1.5 top-2 bottom-2 w-1 rounded-full bg-white/[0.06] z-20">
          <div className="w-full rounded-full bg-white/30"
            style={{
              height: `${Math.min(100, Math.max(6, 100 * (viewportH / visitor.documentH)))}%`,
              marginTop: `${scrollPercent * (1 - viewportH / visitor.documentH)}%`,
              transition: 'margin-top 0.2s',
            }}
          />
        </div>
      )}

    </div>
    </div>
  )

  // ─── Idle state (not capturing, no stream) ───
  if (!isActive && webrtcState !== 'denied') {
    return (
      <div className="w-full h-full min-h-[220px] rounded-[24px] border border-white/[0.08] bg-gradient-to-b from-[#070b18] to-[#0c1024] overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto px-6 py-4">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${accent.avatar} grid place-items-center shadow-2xl shrink-0`}>
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-white/90">{o.screenWatchTitle}</p>
              <p className="text-sm text-white/40 mt-1.5 leading-relaxed">
                {o.screenWatchDesc}<br />
                <span className="text-white/30">{o.screenWatchHint}</span>
              </p>
            </div>
            {!socketLive && (
              <p className="text-xs text-amber-400/90 max-w-xs leading-relaxed">
                {recentlyActive ? o.socketPending : o.visitorOffline}
              </p>
            )}
          </div>
        </div>
        {canStartScreenWatch ? (
          <div className="shrink-0 p-4 pt-2 border-t border-white/[0.06] bg-[#070b18]/95 backdrop-blur-sm safe-area-pb">
            <button
              type="button"
              onClick={handleStart}
              title={o.watchScreen}
              className={`w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01] active:scale-95 touch-manipulation ${
                theme === 'admin'
                  ? `admin-screen-watch-btn ${accent.button}`
                  : 'bg-gradient-to-r from-[#1972F5] to-[#2563EB] shadow-lg shadow-[#1972F5]/25 hover:shadow-[#1972F5]/40'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /></svg>
              {o.watchScreen}
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  // ─── Fullscreen viewer ───
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[999999] flex flex-col bg-black">
        {controlBar}
        <div className="relative flex min-h-0 flex-1">
          {screen}
          {inspectorDrawer}
        </div>
      </div>
    )
  }

  // ─── Embedded full-height viewer ───
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#04070d] shadow-[0_30px_100px_-40px_rgba(124,58,237,0.6)]">
      {controlBar}
      <div className="relative flex min-h-0 flex-1">
        {screen}
        {inspectorDrawer}
      </div>
    </div>
  )
}