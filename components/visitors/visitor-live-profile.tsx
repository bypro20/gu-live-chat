'use client'

import type { LiveVisitor } from '@/lib/stores/live-visitors-store'
import {
  deviceKindLabel,
  formatGeoSourceLabel,
  formatVisitorLocationLine,
  formatVisitorTechLine,
  resolveDeviceKind,
  type DeviceKind,
} from '@/lib/visitor-intelligence'
import { visitorDisplayName } from '@/lib/visitor-live-geo'
import { VisitorMapsLink } from '@/components/visitors/visitor-maps-link'
import { Globe2, Monitor, Route, Smartphone, Tablet, Wifi } from 'lucide-react'

type VisitorLiveProfileProps = {
  visitor: LiveVisitor
  theme?: 'admin' | 'dashboard'
  compact?: boolean
}

function DeviceIcon({ kind }: { kind: DeviceKind }) {
  const cls = 'w-3.5 h-3.5 shrink-0'
  if (kind === 'mobile') return <Smartphone className={cls} />
  if (kind === 'tablet') return <Tablet className={cls} />
  return <Monitor className={cls} />
}

export function VisitorLiveProfile({
  visitor,
  theme = 'admin',
  compact = false,
}: VisitorLiveProfileProps) {
  const isDashboard = theme === 'dashboard'
  const border = isDashboard ? 'border-white/[0.08]' : ''
  const bg = isDashboard ? 'bg-white/[0.03]' : 'admin-monitor-panel'
  const text = isDashboard ? 'text-white' : 'admin-text'
  const muted = isDashboard ? 'text-gray-400' : 'admin-text-muted'

  const deviceKind = resolveDeviceKind(visitor)
  const techLine = formatVisitorTechLine(visitor)
  const locationLine = formatVisitorLocationLine(visitor)
  const geoSourceLabel = formatGeoSourceLabel(visitor.geoSource)

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] ${muted}`}>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 border ${isDashboard ? 'border-white/10 bg-white/[0.04]' : 'border-[var(--admin-border)] bg-[var(--admin-bg-hover)]'} ${text}`}>
          <DeviceIcon kind={deviceKind} />
          {deviceKindLabel(deviceKind)}
        </span>
        {visitor.browser && <span>{visitor.browser}</span>}
        {visitor.os && visitor.os !== 'Unknown' && <span>{visitor.os}</span>}
        {visitor.entrySource && (
          <span className="inline-flex items-center gap-0.5 text-violet-300/90">
            <Route className="w-3 h-3 shrink-0" />
            {visitor.entrySource}
          </span>
        )}
        {locationLine ? (
          <span className="inline-flex items-center gap-0.5">
            <Globe2 className="w-3 h-3 shrink-0" />
            {locationLine}
          </span>
        ) : (
          <span className="opacity-70">Konum çözümleniyor…</span>
        )}
      </div>
    )
  }

  return (
    <div className={`rounded-xl border p-3 space-y-3 shrink-0 ${border} ${bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`text-sm font-semibold ${text}`}>{visitorDisplayName(visitor.name)}</p>
          {visitor.email && <p className={`text-xs truncate ${muted}`}>{visitor.email}</p>}
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDashboard ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {visitor.isLive ? 'Canlı' : 'Son görülme'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className={`rounded-lg border px-2.5 py-2 ${isDashboard ? 'border-white/[0.06] bg-black/20' : 'border-[var(--admin-border)] bg-[var(--admin-bg-hover)]'}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${muted}`}>Cihaz</p>
          <p className={`text-xs font-medium flex items-center gap-1.5 ${text}`}>
            <DeviceIcon kind={deviceKind} />
            {techLine}
          </p>
        </div>

        <div className={`rounded-lg border px-2.5 py-2 ${isDashboard ? 'border-white/[0.06] bg-black/20' : 'border-[var(--admin-border)] bg-[var(--admin-bg-hover)]'}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1 ${muted}`}>
            <Route className="w-3 h-3" /> Giriş kaynağı
          </p>
          <p className={`text-xs font-medium ${text}`}>{visitor.entrySource || 'Doğrudan giriş'}</p>
          {visitor.referrer && (
            <p className={`text-[10px] truncate mt-1 ${muted}`} title={visitor.referrer}>
              Referrer: {visitor.referrer}
            </p>
          )}
        </div>
      </div>

      <div className={`rounded-lg border px-2.5 py-2 ${isDashboard ? 'border-white/[0.06] bg-black/20' : 'border-[var(--admin-border)] bg-[var(--admin-bg-hover)]'}`}>
        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1 ${muted}`}>
          <Globe2 className="w-3 h-3" /> Konum
        </p>
        {locationLine ? (
          <>
            <p className={`text-sm leading-snug ${text}`}>{locationLine}</p>
            <div className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] ${muted}`}>
              {geoSourceLabel && <span>{geoSourceLabel}</span>}
              {visitor.isp && (
                <span className="inline-flex items-center gap-1">
                  <Wifi className="w-3 h-3 shrink-0" />
                  {visitor.isp}
                </span>
              )}
              {visitor.postalCode && <span>PK: {visitor.postalCode}</span>}
            </div>
          </>
        ) : (
          <p className={`text-xs ${muted}`}>IP veya GPS konumu henüz alınamadı</p>
        )}
        {visitor.landingPage && (
          <p className={`text-[10px] truncate mt-2 ${muted}`} title={visitor.landingPage}>
            İlk sayfa: {visitor.landingPage}
          </p>
        )}
        <div className="mt-2">
          <VisitorMapsLink visitor={visitor} />
        </div>
      </div>
    </div>
  )
}
