'use client'

import Link from 'next/link'
import type { LiveVisitor, VisitorActivity } from '@/lib/stores/live-visitors-store'
import { OverlayPreview } from './overlay-preview'
import { VisitorStatusHeader } from './visitor-status-header'
import { CurrentPageCard } from './current-page-card'
import { LiveMetricsGrid } from './live-metrics-grid'
import { PageHistoryTimeline } from './page-history-timeline'
import { ActivityFeed } from './activity-feed'
import type { VisitorTheme } from '@/lib/visitors-utils'

interface VisitorDetailPanelProps {
  visitor: LiveVisitor
  recentClicks: Array<{ x: number; y: number; timestamp: string }>
  activities: VisitorActivity[]
  theme?: VisitorTheme
  overlayEnabled?: boolean
  onScreenCaptureToggle?: (visitorId: string, active: boolean) => void
  isScreenCapturing?: boolean
  webrtcStream?: MediaStream | null
  webrtcState?: 'connecting' | 'connected' | 'failed' | 'denied' | 'idle' | 'new' | 'disconnected' | 'closed'
  privacyMode?: boolean
  onWebRTCHDToggle?: (visitorId: string, active: boolean) => void
}

function OverlayUpgradeCard() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Ekran İzleme</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Canlı ekran görüntüsü, müdahale modu ve HD paylaşım Profesyonel pakette veya ekran izleme eklentisi ile kullanılabilir.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Link
              href="/settings/billing?plan=PRO"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Paketi Yükselt
            </Link>
            <Link
              href="/settings/addons"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors"
            >
              Eklenti Mağazası
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function VisitorTrackingPanel({
  visitor,
  recentClicks,
  activities,
  theme,
}: {
  visitor: LiveVisitor
  recentClicks: Array<{ x: number; y: number; timestamp: string }>
  activities: VisitorActivity[]
  theme: VisitorTheme
}) {
  return (
    <div className="h-full flex flex-col min-h-0 overflow-y-auto">
      <div className="p-4 space-y-4">
        <VisitorStatusHeader visitor={visitor} theme={theme} />
        <CurrentPageCard visitor={visitor} theme={theme} />
        <LiveMetricsGrid visitor={visitor} recentClicks={recentClicks} theme={theme} />
        <PageHistoryTimeline activities={activities} theme={theme} />
        <ActivityFeed activities={activities} theme={theme} />
        <OverlayUpgradeCard />
      </div>
    </div>
  )
}

export function VisitorDetailPanel({
  visitor,
  recentClicks,
  activities,
  theme = 'dashboard',
  overlayEnabled = false,
  onScreenCaptureToggle,
  isScreenCapturing,
  webrtcStream,
  webrtcState,
  privacyMode,
  onWebRTCHDToggle,
}: VisitorDetailPanelProps) {
  if (!overlayEnabled) {
    return (
      <VisitorTrackingPanel
        visitor={visitor}
        recentClicks={recentClicks}
        activities={activities}
        theme={theme}
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
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
