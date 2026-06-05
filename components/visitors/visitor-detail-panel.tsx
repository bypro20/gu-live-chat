'use client'

import type { LiveVisitor, VisitorActivity } from '@/lib/stores/live-visitors-store'
import { OverlayPreview } from './overlay-preview'
import type { VisitorTheme } from '@/lib/visitors-utils'

interface VisitorDetailPanelProps {
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

// ─────────────────────────────────────────────────────────────────────────────
// Visitor detail panel — AnyDesk-style layout.
// The live screen viewer is the dominant element, filling all available height.
// Visitor info is shown as a floating overlay inside the viewer (toggle button).
// ─────────────────────────────────────────────────────────────────────────────
export function VisitorDetailPanel({ visitor, recentClicks, activities, theme = 'dashboard', onScreenCaptureToggle, isScreenCapturing, webrtcStream, webrtcState, privacyMode, onWebRTCHDToggle }: VisitorDetailPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {/* ── Live Screen Viewer — fills entire height ── */}
      <OverlayPreview
        visitor={visitor}
        recentClicks={recentClicks}
        activities={activities}
        theme={theme}
        onScreenCaptureToggle={onScreenCaptureToggle}
        isScreenCapturing={isScreenCapturing}
        webrtcStream={webrtcStream}
        webrtcState={webrtcState}
        privacyMode={privacyMode}
        onWebRTCHDToggle={onWebRTCHDToggle}
      />
    </div>
  )
}