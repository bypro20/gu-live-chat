'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { AdminVisitorsMonitor } from '@/components/admin/admin-visitors-monitor'
import { LiveVisitorsGeoMap } from '@/components/admin/live-visitors-geo-map'
import type { LiveVisitor } from '@/lib/stores/live-visitors-store'

function VisitorsMonitorContent() {
  const { activeWebsite, websites } = useActiveWebsite()
  const searchParams = useSearchParams()
  const initialVisitorId = searchParams.get('visitor')
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitor[]>([])
  const [focusedVisitorId, setFocusedVisitorId] = useState<string | null>(initialVisitorId)

  const fetchLive = useCallback(async () => {
    if (!activeWebsite?.websiteId) {
      setLiveVisitors([])
      return
    }
    try {
      const res = await fetch(`/api/visitors/live?websiteId=${encodeURIComponent(activeWebsite.websiteId)}`)
      if (!res.ok) return
      const data = await res.json()
      setLiveVisitors(data.visitors || [])
    } catch {
      /* ignore */
    }
  }, [activeWebsite?.websiteId])

  useEffect(() => {
    void fetchLive()
    const interval = setInterval(fetchLive, 15000)
    return () => clearInterval(interval)
  }, [fetchLive])

  useEffect(() => {
    if (initialVisitorId) setFocusedVisitorId(initialVisitorId)
  }, [initialVisitorId])

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="shrink-0 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Canlı ziyaretçi haritası
        </p>
        <LiveVisitorsGeoMap
          visitors={liveVisitors}
          selectedVisitorId={focusedVisitorId}
          onSelect={setFocusedVisitorId}
          className="w-full h-44 rounded-xl overflow-hidden border border-white/[0.08] bg-[#0d1117]"
          emptyLabel="Henüz konum verisi yok — widget açılınca haritada görünür"
        />
      </div>
      <div className="flex-1 min-h-0">
        <AdminVisitorsMonitor
          variant="dashboard"
          websiteId={activeWebsite?.websiteId ?? null}
          websiteIds={websites.map((w) => w.websiteId)}
          initialVisitorId={focusedVisitorId}
          onVisitorSelect={setFocusedVisitorId}
        />
      </div>
    </div>
  )
}

export default function VisitorsPage() {
  return (
    <div className="h-full min-h-0 w-full max-w-full flex flex-col overflow-hidden bg-[#080C14] p-2 lg:p-4">
      <Suspense fallback={null}>
        <VisitorsMonitorContent />
      </Suspense>
    </div>
  )
}
