'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { DivIcon, LayerGroup, Map as LeafletMap, Marker } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { LiveVisitor } from '@/lib/stores/live-visitors-store'
import { DEFAULT_MAP_CENTER, resolveVisitorMapCoords } from '@/lib/country-coords'
import { resolveVisitorMapsUrl, visitorDisplayName } from '@/lib/visitor-live-geo'
import { formatVisitorGeoLine } from '@/lib/visitor-session-enrich'
import {
  deviceKindLabel,
  formatVisitorTechLine,
  resolveDeviceKind,
} from '@/lib/visitor-intelligence'

type MapPin = {
  visitorId: string
  lat: number
  lng: number
  approximate: boolean
  visitor: LiveVisitor
}

type LiveVisitorsGeoMapProps = {
  visitors: LiveVisitor[]
  selectedVisitorId?: string | null
  onSelect?: (visitorId: string) => void
  className?: string
  emptyLabel?: string
  height?: number
}

const DEFAULT_HEIGHT = 440
const MAP_TILE =
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'

function countryFlag(country?: string | null): string {
  if (!country) return '🌍'
  const c = country.trim().toUpperCase()
  if (c === 'TURKEY' || c === 'TÜRKIYE' || c === 'TURKIYE' || c === 'TR') return '🇹🇷'
  if (c.length === 2) {
    const code = c
    return String.fromCodePoint(
      ...[...code].map((ch) => 127397 + ch.charCodeAt(0))
    )
  }
  return '🌍'
}

function buildPinIcon(
  L: typeof import('leaflet'),
  selected: boolean,
  approximate: boolean,
  live: boolean
): DivIcon {
  const color = selected ? '#8b5cf6' : approximate ? '#f59e0b' : '#10b981'
  const pulse = live
    ? `<span class="gu-map-pin-pulse" style="background:${color}"></span>`
    : ''
  return L.divIcon({
    className: 'gu-map-pin-wrap',
    html: `
      <div class="gu-map-pin ${selected ? 'gu-map-pin--selected' : ''}" style="--pin-color:${color}">
        ${pulse}
        <svg viewBox="0 0 24 36" width="28" height="42" aria-hidden="true">
          <path fill="${color}" stroke="#fff" stroke-width="1.5"
            d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/>
          <circle cx="12" cy="12" r="4.5" fill="#fff"/>
        </svg>
      </div>
    `,
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -38],
  })
}

function buildPopupHtml(pin: MapPin): string {
  const v = pin.visitor
  const name = visitorDisplayName(v.name)
  const address = formatVisitorGeoLine(v) || v.country || 'Konum bilinmiyor'
  const source = pin.approximate
    ? 'IP — şehir/ülke düzeyi'
    : v.geoSource === 'gps'
      ? 'GPS — kesin konum'
      : v.geoSource === 'ip'
        ? 'IP — kesin koordinat'
        : 'Konum'
  const device = formatVisitorTechLine(v)
  const mapsUrl = resolveVisitorMapsUrl({
    ...v,
    latitude: v.latitude ?? pin.lat,
    longitude: v.longitude ?? pin.lng,
    geoAddress: v.geoAddress || formatVisitorGeoLine(v) || null,
  })
  const mapsLink = mapsUrl
    ? `<a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;margin-top:8px;font-size:11px;font-weight:600;color:#7c3aed;text-decoration:none">📍 Konuma git</a>`
    : ''
  const entry = v.entrySource
    ? `<div style="margin-top:6px;font-size:11px;color:#a78bfa">Giriş: ${v.entrySource}</div>`
    : `<div style="margin-top:6px;font-size:11px;color:#94a3b8">Giriş: Doğrudan giriş</div>`
  const deviceLine = `<div style="margin-top:4px;font-size:11px;color:#475569">${deviceKindLabel(resolveDeviceKind(v))} · ${device}</div>`
  const landing = v.landingPage
    ? `<div style="margin-top:4px;font-size:10px;color:#94a3b8;word-break:break-all">Sayfa: ${v.landingPage}</div>`
    : ''
  const site = v.websiteName
    ? `<div style="margin-top:4px;font-size:10px;color:#64748b">${v.websiteName}</div>`
    : ''

  return `
    <div style="min-width:180px;font-family:system-ui,sans-serif">
      <div style="font-weight:600;font-size:13px;color:#0f172a">${countryFlag(v.country)} ${name}</div>
      <div style="margin-top:4px;font-size:12px;color:#334155">${address}</div>
      <div style="margin-top:4px;font-size:10px;color:#64748b">${source}</div>
      ${deviceLine}${entry}${landing}${site}${mapsLink}
    </div>
  `
}

export function LiveVisitorsGeoMap({
  visitors,
  selectedVisitorId,
  onSelect,
  className = '',
  emptyLabel = 'Henüz konum verisi yok',
  height = DEFAULT_HEIGHT,
}: LiveVisitorsGeoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const layerRef = useRef<LayerGroup | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const boundsKeyRef = useRef('')
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  const pins = useMemo(() => {
    const out: MapPin[] = []
    for (const visitor of visitors) {
      const coords = resolveVisitorMapCoords({
        latitude: visitor.latitude,
        longitude: visitor.longitude,
        country: visitor.country,
        city: visitor.city,
      })
      if (!coords) continue
      out.push({
        visitorId: visitor.visitorId,
        lat: coords.lat,
        lng: coords.lng,
        approximate: coords.approximate,
        visitor,
      })
    }
    return out
  }, [visitors])
  const pendingGeo = useMemo(
    () => visitors.filter((v) => v.isLive && !pins.some((p) => p.visitorId === v.visitorId)),
    [visitors, pins]
  )
  const countrySummary = useMemo(() => {
    const map = new Map<string, number>()
    for (const pin of pins) {
      const key = pin.visitor.country || 'Bilinmiyor'
      map.set(key, (map.get(key) || 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [pins])

  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return

    let resizeObserver: ResizeObserver | undefined
    let cancelled = false

    void import('leaflet').then((leafletMod) => {
      if (cancelled || !containerRef.current || mapRef.current) return

      const L = 'default' in leafletMod && leafletMod.default ? leafletMod.default : leafletMod
      const map = L.map(container, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      })

      L.tileLayer(MAP_TILE, {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map)

      layerRef.current = L.layerGroup().addTo(map)
      map.setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], 5)
      mapRef.current = map

      const invalidate = () => map.invalidateSize()
      resizeObserver = new ResizeObserver(invalidate)
      resizeObserver.observe(container)
      requestAnimationFrame(invalidate)
      window.setTimeout(invalidate, 120)
      window.setTimeout(invalidate, 400)
    })

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      markersRef.current.clear()
      layerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return

    void import('leaflet').then((leafletMod) => {
      if (!mapRef.current || !layerRef.current) return
      const L = 'default' in leafletMod && leafletMod.default ? leafletMod.default : leafletMod

      const nextIds = new Set(pins.map((p) => p.visitorId))
      for (const [id, marker] of markersRef.current) {
        if (!nextIds.has(id)) {
          marker.remove()
          markersRef.current.delete(id)
        }
      }

      if (pins.length === 0) {
        layer.clearLayers()
        markersRef.current.clear()
        map.setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], 5)
        boundsKeyRef.current = ''
        window.setTimeout(() => map.invalidateSize(), 80)
        return
      }

      const bounds: [number, number][] = []

      for (const pin of pins) {
        bounds.push([pin.lat, pin.lng])
        const selected = pin.visitorId === selectedVisitorId
        const existing = markersRef.current.get(pin.visitorId)

        if (existing) {
          existing.setLatLng([pin.lat, pin.lng])
          existing.setIcon(buildPinIcon(L, selected, pin.approximate, pin.visitor.isLive))
          existing.setPopupContent(buildPopupHtml(pin))
          if (selected) existing.openPopup()
        } else {
          const marker = L.marker([pin.lat, pin.lng], {
            icon: buildPinIcon(L, selected, pin.approximate, pin.visitor.isLive),
          })
          marker.bindPopup(buildPopupHtml(pin))
          marker.on('click', () => onSelectRef.current?.(pin.visitorId))
          marker.addTo(layer)
          markersRef.current.set(pin.visitorId, marker)
        }
      }

      const boundsKey = bounds.map((b) => b.join(',')).join('|')
      if (boundsKey !== boundsKeyRef.current) {
        boundsKeyRef.current = boundsKey
        const allApproximate = pins.every((p) => p.approximate)
        if (bounds.length === 1) {
          map.setView(bounds[0], allApproximate ? 8 : 14)
        } else {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: allApproximate ? 6 : 14 })
        }
      } else if (selectedVisitorId) {
        const pin = pins.find((p) => p.visitorId === selectedVisitorId)
        if (pin) map.panTo([pin.lat, pin.lng], { animate: true, duration: 0.4 })
      }

      window.setTimeout(() => map.invalidateSize(), 80)
    })
  }, [pins, selectedVisitorId])

  return (
    <div className="relative w-full">
      <style jsx global>{`
        .gu-map-pin-wrap {
          background: transparent !important;
          border: none !important;
        }
        .gu-map-pin {
          position: relative;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
          transition: transform 0.15s ease;
        }
        .gu-map-pin--selected {
          transform: scale(1.12);
          z-index: 1000 !important;
        }
        .gu-map-pin-pulse {
          position: absolute;
          left: 50%;
          top: 10px;
          width: 14px;
          height: 14px;
          margin-left: -7px;
          border-radius: 50%;
          opacity: 0.45;
          animation: gu-map-pulse 1.8s ease-out infinite;
          pointer-events: none;
        }
        @keyframes gu-map-pulse {
          0% { transform: scale(0.6); opacity: 0.6; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
        }
      `}</style>

      <div className="relative">
        <div
          ref={containerRef}
          className={`w-full rounded-xl overflow-hidden border border-white/[0.06] bg-[#eef2f6] ${className}`}
          style={{ height, minHeight: height }}
          aria-label="Canlı ziyaretçi haritası"
        />

        {countrySummary.length > 0 && (
          <div className="pointer-events-none absolute top-3 right-3 z-[1000] max-w-[160px] rounded-xl border border-white/20 bg-slate-900/85 backdrop-blur-sm p-2.5 shadow-lg">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Ülkeler
            </p>
            <ul className="space-y-1">
              {countrySummary.slice(0, 6).map(([country, count]) => (
                <li key={country} className="flex items-center justify-between gap-2 text-[11px] text-slate-200">
                  <span className="truncate">{countryFlag(country)} {country}</span>
                  <span className="tabular-nums text-emerald-400 font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pins.length === 0 && visitors.length > 0 && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-[#0d1117]/45"
            style={{ height }}
          >
            <p className="max-w-[85%] text-center text-xs text-gray-300 px-4">
              {pendingGeo.length} canlı ziyaretçi — IP/GPS konumu çözümleniyor
            </p>
          </div>
        )}

        {pins.length === 0 && visitors.length === 0 && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-[#0d1117]/55"
            style={{ height }}
          >
            <p className="max-w-[85%] text-center text-xs text-gray-400 px-4">{emptyLabel}</p>
          </div>
        )}
      </div>

      {pins.length > 0 && (
        <p className="mt-2 text-[10px] text-gray-500">
          <span className="text-emerald-400">●</span> Kesin konum (IP/GPS)
          {' · '}
          <span className="text-amber-400">●</span> Şehir/ülke (IP yedek)
          {' · '}
          Nabız = şu an sitede
        </p>
      )}

      {pendingGeo.length > 0 && (
        <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            Konum bekleyen ({pendingGeo.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {pendingGeo.slice(0, 6).map((v) => (
              <span
                key={v.visitorId}
                className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-gray-300"
              >
                {visitorDisplayName(v.name)} · {deviceKindLabel(resolveDeviceKind(v))}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
