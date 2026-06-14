'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Eye, Globe2, MapPin, Monitor, Smartphone, Tablet, ArrowRight, RefreshCw,
} from 'lucide-react'
import type { LiveVisitor } from '@/lib/stores/live-visitors-store'
import { formatTimeAgo, getBrowserLabel, getDeviceLabel } from '@/lib/visitors-utils'
import { useVisitorsI18n } from '@/lib/hooks/use-visitors-i18n'

interface LiveVisitorsSummaryProps {
  variant?: 'admin' | 'dashboard'
  websiteId?: string | null
  limit?: number
}

function DeviceIcon({ device }: { device?: string | null }) {
  const d = (device || '').toLowerCase()
  if (d.includes('mobile') || d.includes('iphone') || d.includes('android')) {
    return <Smartphone className="w-3.5 h-3.5 shrink-0" />
  }
  if (d.includes('tablet') || d.includes('ipad')) {
    return <Tablet className="w-3.5 h-3.5 shrink-0" />
  }
  return <Monitor className="w-3.5 h-3.5 shrink-0" />
}

export function LiveVisitorsSummary({
  variant = 'admin',
  websiteId = null,
  limit = 6,
}: LiveVisitorsSummaryProps) {
  const isDashboard = variant === 'dashboard'
  const { monitor: m, summary: s, locale } = useVisitorsI18n()
  const [visitors, setVisitors] = useState<LiveVisitor[]>([])
  const [loading, setLoading] = useState(true)
  const [upgradeRequired, setUpgradeRequired] = useState(false)

  const fetchVisitors = useCallback(async () => {
    try {
      const url = isDashboard
        ? `/api/visitors/live${websiteId ? `?websiteId=${encodeURIComponent(websiteId)}` : ''}`
        : '/api/admin/visitors/live'
      const res = await fetch(url)
      if (isDashboard && res.status === 403) {
        const data = await res.json()
        if (data.upgradeRequired) {
          setUpgradeRequired(true)
          setVisitors([])
          return
        }
      }
      if (!res.ok) return
      const data = await res.json()
      setUpgradeRequired(false)
      setVisitors((data.visitors || []).slice(0, limit))
    } catch {
      // ignore polling errors
    } finally {
      setLoading(false)
    }
  }, [isDashboard, websiteId, limit])

  useEffect(() => {
    fetchVisitors()
    const interval = setInterval(fetchVisitors, 15000)
    return () => clearInterval(interval)
  }, [fetchVisitors])

  const liveCount = visitors.filter((v) => v.isLive).length
  const detailHref = isDashboard ? '/visitors' : '/admin/visitors'

  if (upgradeRequired) {
    return (
      <div className={isDashboard ? 'app-panel p-6' : 'admin-live-summary rounded-2xl border p-6'}>
        <div className="flex items-center gap-2 mb-2">
          <Eye className={`w-4 h-4 ${isDashboard ? 'text-primary' : 'text-emerald-400'}`} />
          <h2 className={`text-base font-semibold ${isDashboard ? '' : 'admin-text'}`}>{s.title}</h2>
        </div>
        <p className={`text-sm ${isDashboard ? 'text-muted-foreground' : 'admin-text-muted'}`}>{m.upgradeDesc}</p>
        <Link
          href="/settings/billing"
          className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3"
        >
          {m.upgradeCta} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    )
  }

  return (
    <div className={isDashboard ? 'app-panel p-6' : 'admin-live-summary rounded-2xl border p-6'}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className={`text-base font-semibold flex items-center gap-2 ${isDashboard ? '' : 'admin-text'}`}>
            <Eye className={`w-4 h-4 ${isDashboard ? 'text-primary' : 'text-emerald-400'}`} />
            {s.title}
            {liveCount > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </h2>
          <p className={`text-xs mt-0.5 ${isDashboard ? 'text-muted-foreground' : 'admin-text-muted'}`}>
            {s.subtitle(visitors.length, liveCount)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setLoading(true); void fetchVisitors() }}
            className={`p-2 rounded-lg transition-colors ${isDashboard ? 'hover:bg-muted text-muted-foreground' : 'admin-text-muted hover:bg-[var(--admin-bg-hover)]'}`}
            aria-label={s.refresh}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href={detailHref}
            className={`text-xs font-medium flex items-center gap-1 ${isDashboard ? 'text-primary' : 'text-emerald-400 hover:text-emerald-300'}`}
          >
            {s.viewAll} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {loading && visitors.length === 0 ? (
        <div className={`py-10 text-center text-sm ${isDashboard ? 'text-muted-foreground' : 'admin-text-muted'}`}>
          {s.loading}
        </div>
      ) : visitors.length === 0 ? (
        <div className={`py-10 text-center text-sm ${isDashboard ? 'text-muted-foreground' : 'admin-text-muted'}`}>
          <Globe2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          {s.empty}
        </div>
      ) : (
        <div className="space-y-2">
          {visitors.map((visitor) => (
            <Link
              key={visitor.visitorId}
              href={`${detailHref}?visitor=${encodeURIComponent(visitor.visitorId)}`}
              className={`block rounded-xl p-3 transition-colors ${
                isDashboard
                  ? 'border border-border hover:bg-muted/50'
                  : 'admin-live-summary-item border hover:bg-[var(--admin-bg-hover)]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    visitor.isLive
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : isDashboard ? 'bg-muted-foreground/40' : 'bg-gray-600'
                  }`}>
                    {(visitor.name || 'A')[0].toUpperCase()}
                  </div>
                  {visitor.isLive && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold truncate ${isDashboard ? '' : 'admin-text'}`}>
                      {visitor.name || m.anonymous}
                    </p>
                    <span className={`text-[10px] shrink-0 ${isDashboard ? 'text-muted-foreground' : 'admin-text-muted'}`}>
                      {visitor.lastActiveAt ? formatTimeAgo(visitor.lastActiveAt, locale) : ''}
                    </span>
                  </div>
                  <p className={`text-[11px] truncate mt-0.5 ${isDashboard ? 'text-muted-foreground' : 'admin-text-secondary'}`}>
                    {visitor.currentTitle || visitor.currentPage || '—'}
                  </p>
                  <div className={`flex items-center gap-2 mt-1.5 flex-wrap text-[10px] ${isDashboard ? 'text-muted-foreground' : 'admin-text-muted'}`}>
                    {(visitor.country || visitor.city) && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {[visitor.city, visitor.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {visitor.device && (
                      <span className="flex items-center gap-0.5">
                        <DeviceIcon device={visitor.device} />
                        {getDeviceLabel(visitor.device, locale)}
                      </span>
                    )}
                    {visitor.browser && (
                      <span>{getBrowserLabel(visitor.browser, locale)}</span>
                    )}
                    {!isDashboard && visitor.websiteName && (
                      <span className={isDashboard ? 'text-primary' : 'text-violet-400/80'}>{visitor.websiteName}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
