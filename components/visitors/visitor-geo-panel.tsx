'use client'

import type { LiveVisitor } from '@/lib/stores/live-visitors-store'
import { formatVisitorGeoLine } from '@/lib/visitor-session-enrich'
import { mapsExternalUrl } from '@/lib/visitor-live-geo'
import { ExternalLink, MapPin, Route, Wifi } from 'lucide-react'

type VisitorGeoPanelProps = {
  visitor: LiveVisitor
  theme?: 'admin' | 'dashboard'
}

export function VisitorGeoPanel({ visitor, theme = 'admin' }: VisitorGeoPanelProps) {
  const isDashboard = theme === 'dashboard'
  const border = isDashboard ? 'border-white/[0.08]' : ''
  const bg = isDashboard ? 'bg-white/[0.03]' : 'admin-monitor-panel'
  const text = isDashboard ? 'text-white' : 'admin-text'
  const muted = isDashboard ? 'text-gray-400' : 'admin-text-muted'

  const address = formatVisitorGeoLine(visitor)
  const hasCoords = visitor.latitude != null && visitor.longitude != null
  const mapsUrl = hasCoords
    ? mapsExternalUrl(visitor.latitude!, visitor.longitude!, address)
    : null

  return (
    <div className={`rounded-xl border p-3 space-y-2 shrink-0 ${border} ${bg}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${muted}`}>
        <MapPin className="w-3 h-3" /> Konum & giriş
      </p>

      {address ? (
        <p className={`text-sm leading-snug ${text}`}>{address}</p>
      ) : (
        <p className={`text-xs ${muted}`}>Konum henüz çözümlenmedi</p>
      )}

      <div className={`flex flex-wrap gap-x-3 gap-y-1 text-[11px] ${muted}`}>
        {visitor.entrySource && (
          <span className="inline-flex items-center gap-1">
            <Route className="w-3 h-3 shrink-0" />
            {visitor.entrySource}
          </span>
        )}
        {visitor.geoSource && (
          <span>
            Kaynak: {visitor.geoSource === 'gps' ? 'Cihaz GPS' : 'IP konumu'}
          </span>
        )}
        {visitor.isp && (
          <span className="inline-flex items-center gap-1">
            <Wifi className="w-3 h-3 shrink-0" />
            {visitor.isp}
          </span>
        )}
        {visitor.postalCode && <span>PK: {visitor.postalCode}</span>}
      </div>

      {visitor.landingPage && (
        <p className={`text-[10px] truncate ${muted}`} title={visitor.landingPage}>
          Sayfa: {visitor.landingPage}
        </p>
      )}
      {visitor.referrer && (
        <p className={`text-[10px] truncate ${muted}`} title={visitor.referrer}>
          Referrer: {visitor.referrer}
        </p>
      )}

      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-400 hover:text-violet-300"
        >
          Haritada aç <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}
