'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { Map as LeafletMap, LayerGroup, CircleMarker } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { LiveVisitor } from '@/lib/stores/live-visitors-store'
import { DEFAULT_MAP_CENTER, resolveVisitorMapCoords } from '@/lib/country-coords'
import { formatVisitorGeoLine } from '@/lib/visitor-session-enrich'

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
}

const MAP_HEIGHT = 320
const OSM_TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

export function LiveVisitorsGeoMap({
  visitors,
  selectedVisitorId,
  onSelect,
  className = '',
  emptyLabel = 'Henüz konum verisi yok',
}: LiveVisitorsGeoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const layerRef = useRef<LayerGroup | null>(null)
  const markersRef = useRef<CircleMarker[]>([])
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  const pins = useMemo(() => {
    const out: MapPin[] = []
    for (const visitor of visitors) {
      const coords = resolveVisitorMapCoords(visitor)
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

  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return

    let resizeObserver: ResizeObserver | undefined
    let cancelled = false

    void import('leaflet').then((mod) => {
      if (cancelled || !containerRef.current || mapRef.current) return

      const L = mod.default
      const map = L.map(container, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      })

      L.tileLayer(OSM_TILE, {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
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
      markersRef.current = []
      layerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return

    void import('leaflet').then((mod) => {
      if (!mapRef.current || !layerRef.current) return
      const L = mod.default

      for (const marker of markersRef.current) {
        marker.remove()
      }
      markersRef.current = []
      layer.clearLayers()

      if (pins.length === 0) {
        map.setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], 5)
        window.setTimeout(() => map.invalidateSize(), 80)
        return
      }

      const bounds: [number, number][] = []
      for (const pin of pins) {
        bounds.push([pin.lat, pin.lng])
        const selected = pin.visitorId === selectedVisitorId
        const marker = L.circleMarker([pin.lat, pin.lng], {
          radius: selected ? 10 : pin.approximate ? 6 : 8,
          color: selected ? '#ffffff' : pin.approximate ? '#fbbf24' : '#34d399',
          weight: selected ? 2 : 1,
          fillColor: selected ? '#8b5cf6' : pin.approximate ? '#f59e0b' : '#10b981',
          fillOpacity: 0.92,
          dashArray: pin.approximate ? '4 3' : undefined,
        })

        const label = pin.visitor.name || 'Ziyaretçi'
        const address = formatVisitorGeoLine(pin.visitor)
        const entry = pin.visitor.entrySource ? `<br/>Giriş: ${pin.visitor.entrySource}` : ''
        const source = pin.approximate
          ? ' (yaklaşık)'
          : pin.visitor.geoSource === 'gps'
            ? ' (GPS)'
            : pin.visitor.geoSource === 'ip'
              ? ' (IP)'
              : ''

        marker.bindPopup(`<strong>${label}</strong><br/>${address}${source}${entry}`)
        marker.on('click', () => onSelectRef.current?.(pin.visitorId))
        marker.addTo(layer)
        markersRef.current.push(marker)
      }

      const allApproximate = pins.every((p) => p.approximate)
      if (bounds.length === 1) {
        map.setView(bounds[0], allApproximate ? 8 : 14)
      } else {
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: allApproximate ? 6 : 14 })
      }

      window.setTimeout(() => map.invalidateSize(), 80)
    })
  }, [pins, selectedVisitorId])

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className={`w-full rounded-xl overflow-hidden border border-white/[0.06] bg-[#0d1117] ${className}`}
        style={{ height: MAP_HEIGHT, minHeight: MAP_HEIGHT }}
        aria-label="Canlı ziyaretçi haritası"
      />
      {pins.length === 0 && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-[#0d1117]/55"
          style={{ height: MAP_HEIGHT }}
        >
          <p className="max-w-[85%] text-center text-xs text-gray-400 px-4">{emptyLabel}</p>
        </div>
      )}
      {pins.some((p) => p.approximate) && pins.length > 0 && (
        <p className="mt-2 text-[10px] text-amber-500/90">
          Turuncu kesikli pinler yaklaşık konum (ülke/şehir).
        </p>
      )}
    </div>
  )
}
