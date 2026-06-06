'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { LiveVisitor, VisitorActivity } from '@/lib/stores/live-visitors-store'
import { getAccent, type VisitorTheme } from '@/lib/visitors-utils'
import { useSocket } from '@/lib/hooks/use-socket'

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
  const { emit } = useSocket()
  const videoRef = useRef<HTMLVideoElement>(null)
  const screenshotImgRef = useRef<HTMLImageElement>(null)
  const [isStopping, setIsStopping] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [showInfo, setShowInfo] = useState(false)
  const [screenshotReady, setScreenshotReady] = useState(false)
  const [remoteClicks, setRemoteClicks] = useState<Array<{ x: number; y: number; timestamp: number }>>([])
  const [interventionMode, setInterventionMode] = useState(false)
  const lastScreenshotRef = useRef<string | null>(null)
  const { emit: socketEmit } = useSocket()

  const viewportW = visitor.viewportW || 1920
  const viewportH = visitor.viewportH || 1080

  const lastInterventionEmitRef = useRef(0)

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

  useEffect(() => {
    const img = screenshotImgRef.current
    if (!img || !visitor.screenshotUrl) return
    if (visitor.screenshotUrl !== lastScreenshotRef.current) {
      img.src = visitor.screenshotUrl
      lastScreenshotRef.current = visitor.screenshotUrl
      setScreenshotReady(true)
    }
  }, [visitor.screenshotUrl])

  useEffect(() => {
    if (!isScreenCapturing) {
      setScreenshotReady(false)
      lastScreenshotRef.current = null
      const img = screenshotImgRef.current
      if (img) img.src = ''
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

  const displayName = visitor.name || 'Anonim'
  const initial = displayName[0]?.toUpperCase() || 'A'

  const formatDuration = (dateStr?: string) => {
    if (!dateStr) return ''
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'az önce'
    if (mins < 60) return `${mins} dk`
    const hours = Math.floor(mins / 60)
    return `${hours} sa ${mins % 60} dk`
  }

  const showScreenshot = !!isScreenCapturing && !hasWebRTC && screenshotReady

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
    <div className="flex items-center justify-between gap-2 px-3 h-12 shrink-0 bg-gradient-to-r from-[#0c0f1d] to-[#111527] border-b border-white/[0.08]">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {(isConnected || screenshotReady) && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${(isConnected || screenshotReady) ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">{(isConnected || screenshotReady) ? 'CANLI' : 'BEKLE'}</span>
        </div>
        <span className="h-4 w-px bg-white/[0.08]" />
        <span className="text-[11px] font-mono tabular-nums text-white/50">{viewportW}×{viewportH}</span>
        {scrollPercent > 0 && (
          <>
            <span className="h-4 w-px bg-white/[0.08]" />
            <span className="text-[11px] font-mono tabular-nums text-white/50">↕ {scrollPercent}%</span>
          </>
        )}
        <span className="h-4 w-px bg-white/[0.08]" />
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
          {isConnected ? 'HD' : 'SD'}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Intervention mode toggle — cursor icon */}
        {isActive && (
          <button
            onClick={() => setInterventionMode((v) => !v)}
            title={interventionMode ? 'Müdahale modunu kapat' : 'Fare ile müdahale et'}
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
            {interventionMode && <span>Müdahale</span>}
          </button>
        )}
        {/* Visitor info toggle */}
        <button
          onClick={() => setShowInfo((v) => !v)}
          title="Ziyaretçi Bilgisi"
          className={`w-8 h-8 grid place-items-center rounded-lg transition-colors ${showInfo ? 'bg-white/[0.12] text-white/90' : 'text-white/40 hover:bg-white/[0.06] hover:text-white/70'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
        {/* Zoom */}
        <div className="flex items-center gap-0.5 bg-white/[0.06] rounded-lg px-1 py-0.5">
          <button onClick={zoomOut} disabled={zoom <= 1} title="Uzaklaştır" className="w-6 h-6 grid place-items-center rounded text-white/40 hover:bg-white/[0.08] hover:text-white/70 disabled:opacity-25 disabled:hover:bg-transparent text-sm leading-none">−</button>
          <button onClick={zoomReset} title="Sıfırla" className="px-1 text-[10px] font-mono text-white/35 hover:text-white/70 min-w-[36px]">{Math.round(zoom * 100)}%</button>
          <button onClick={zoomIn} disabled={zoom >= 4} title="Yakınlaştır" className="w-6 h-6 grid place-items-center rounded text-white/40 hover:bg-white/[0.08] hover:text-white/70 disabled:opacity-25 disabled:hover:bg-transparent text-sm leading-none">+</button>
        </div>
        {/* Fullscreen */}
        <button onClick={() => setIsFullscreen((f) => !f)} title={isFullscreen ? 'Küçült' : 'Tam ekran'} className="w-8 h-8 grid place-items-center rounded-lg text-white/40 hover:bg-white/[0.08] hover:text-white/80 transition-colors">
          {isFullscreen ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V5m0 4H5m4 0L4 4m11 5h4m-4 0V5m0 4l5-5M9 15v4m0-4H5m4 0l-5 5m11-5h4m-4 0v4m0-4l5 5" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          )}
        </button>
        {/* Stop */}
        <button onClick={handleStop} disabled={isStopping} className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[11px] font-semibold text-white bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-wait transition-colors">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          {isStopping ? 'Kapatılıyor…' : 'Bağlantıyı Kes'}
        </button>
      </div>
    </div>
  )

  // ─── Visitor info overlay (floating, bottom-left) ───
  const visitorInfoOverlay = isActive && (
    <div className={`absolute bottom-3 left-3 z-20 transition-all duration-300 ${showInfo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
      <div className="bg-[#0c1024]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-2xl p-3.5 min-w-[260px] max-w-[320px]">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${accent.avatar} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}>
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/90 truncate">{displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {visitor.isLive && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-medium">Çevrimiçi</span>
                </span>
              )}
              {visitor.startedAt && (
                <span className="text-[10px] text-white/30">{formatDuration(visitor.startedAt)}</span>
              )}
            </div>
          </div>
        </div>
        {visitor.currentTitle && (
          <div className="mb-2.5 px-2.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <p className="text-[10px] text-white/40 uppercase font-semibold tracking-wider mb-1">Mevcut Sayfa</p>
            <p className="text-xs text-white/70 truncate">{visitor.currentTitle}</p>
            {visitor.currentPage && (
              <p className="text-[10px] text-white/30 truncate mt-0.5">{visitor.currentPage}</p>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 text-[10px] text-white/40">
          {(visitor.browser || visitor.device) && (
            <span>{visitor.browser || 'Browser'} • {visitor.device || 'Desktop'}</span>
          )}
          {visitor.country && (
            <span>• {visitor.country}{visitor.city ? `, ${visitor.city}` : ''}</span>
          )}
        </div>
        {activities.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-white/[0.08]">
            <p className="text-[10px] text-white/40 uppercase font-semibold tracking-wider mb-1.5">Son Aktiviteler</p>
            <div className="space-y-1">
              {activities.slice(0, 3).map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span className="text-white/25">
                    {a.eventType === 'pageview' ? '📄' : a.eventType === 'click' ? '👆' : a.eventType === 'scroll' ? '↕️' : a.eventType === 'input' ? '⌨️' : '•'}
                  </span>
                  <span className="text-white/50 truncate">
                    {a.eventType === 'pageview' ? a.title || a.url : a.eventType === 'click' ? a.text || a.selector : a.eventType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ─── Cursor position ───
  const cursorX = visitor.cursorX
  const cursorY = visitor.cursorY
  const showCursor = isActive && cursorX !== undefined && cursorY !== undefined

  // ─── The screen surface ───
  const screen = (
    <div
      className="relative flex-1 min-h-0 bg-black overflow-hidden"
      onClick={handleRemoteClick}
      onMouseMove={handleInterventionMouseMove}
      onWheel={handleInterventionWheel}
      style={{ cursor: interventionMode && isActive && zoom <= 1 ? 'crosshair' : undefined }}
    >
      {/* Intervention mode banner */}
      {interventionMode && isActive && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600/95 backdrop-blur-sm text-white text-[12px] font-semibold shadow-xl shadow-sky-600/40 pointer-events-none animate-pulse">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 13l6 6" />
          </svg>
          Müdahale Modu — Fare, klavye ve scroll ile yardım edin
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
            objectFit: 'contain',
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
          alt="Canlı ekran"
          className="absolute inset-0 w-full h-full block"
          style={{
            objectFit: 'contain',
            background: '#000',
            transform: zoom > 1 ? `scale(${zoom})` : undefined,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
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
            <span className="text-sm font-medium">Canlı ekran bağlantısı kuruluyor…</span>
            <span className="text-xs text-white/30">Ekran görüntüsü bekleniyor</span>
          </div>
        </div>
      )}

      {/* Denied state */}
      {!hasWebRTC && webrtcState === 'denied' && (
        <div className="absolute inset-0 grid place-items-center bg-[#050816]">
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 grid place-items-center text-2xl">🚫</div>
            <p className="text-sm font-semibold text-white/90">Ziyaretçi ekran paylaşımını reddetti</p>
            <button onClick={handleStart} className="mt-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#1972F5] to-[#2563EB] hover:opacity-90 transition-opacity">Tekrar Dene</button>
          </div>
        </div>
      )}

      {/* Privacy overlay */}
      {privacyMode && isActive && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-[#050816]/98 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-sky-500/20 grid place-items-center text-3xl">🔒</div>
            <div>
              <p className="text-lg font-bold text-white">Gizlilik nedeniyle ekran gizlendi</p>
              <p className="text-sm text-white/40 mt-1.5 leading-relaxed">
                Ziyaretçi hassas bilgi (şifre, kart, CVV vb.) giriyor.<br />Ekran geçici olarak gizlendi.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-amber-400 font-medium">Giriş bitince otomatik devam edecek</span>
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

      {/* Visitor info overlay */}
      {visitorInfoOverlay}
    </div>
  )

  // ─── Idle state (not capturing, no stream) ───
  if (!isActive && webrtcState !== 'denied') {
    return (
      <div className="w-full h-full rounded-[24px] border border-white/[0.08] bg-gradient-to-b from-[#070b18] to-[#0c1024] overflow-hidden flex items-center justify-center">
        <div className="flex flex-col items-center gap-5 text-center px-6 max-w-sm">
          <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${accent.avatar} grid place-items-center shadow-2xl`}>
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-white/90">Ekran İzleme</p>
            <p className="text-sm text-white/40 mt-1.5 leading-relaxed">
              Ziyaretçinin ekranını gerçek zamanlı izleyin.<br />
              <span className="text-white/30">Kredi kartı ve şifre gizlilik koruması • Fare ile müdahale</span>
            </p>
          </div>
          {visitor.isLive ? (
            <button onClick={handleStart} className="mt-1 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#1972F5] to-[#2563EB] shadow-lg shadow-[#1972F5]/25 hover:shadow-[#1972F5]/40 hover:scale-[1.02] active:scale-95 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /></svg>
              Ekranı İzle
            </button>
          ) : (
            <span className="text-xs text-white/20">Ziyaretçi çevrimdışı</span>
          )}
        </div>
      </div>
    )
  }

  // ─── Fullscreen viewer ───
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[999999] flex flex-col bg-black">
        {controlBar}
        {screen}
      </div>
    )
  }

  // ─── Embedded full-height viewer ───
  return (
    <div className="relative w-full h-full flex flex-col rounded-[24px] border border-white/[0.08] bg-gradient-to-b from-[#070b18] to-[#0c1024] overflow-hidden shadow-2xl">
      {controlBar}
      {screen}
    </div>
  )
}