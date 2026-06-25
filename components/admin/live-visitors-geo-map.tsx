'use client'

import { useEffect, useMemo, useRef } from 'react'
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

type LeafletContainer = HTMLDivElement & { _leaflet_id?: number }

function resetLeafletContainer(container: LeafletContainer) {
  if (container._leaflet_id != null) {
    container.replaceChildren()
    delete container._leaflet_id
  }
}

export function LiveVisitorsGeoMap({
  visitors,
  selectedVisitorId,
  onSelect,
  className = 'h-56 w-full rounded-xl overflow-hidden border border-white/[0.08]',
  emptyLabel = 'Henüz konum verisi yok',
}: LiveVisitorsGeoMapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const layerRef = useRef<import('leaflet').LayerGroup | null>(null)
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
    const wrapper = wrapperRef.current
    if (!wrapper) return

    let cancelled = false
    let resizeObserver: ResizeObserver | undefined

    ;(async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')
      if (cancelled || !wrapperRef.current) return

      let container = wrapper.querySelector('[data-live-map-root]') as LeafletContainer | null
      if (!container) {
        container = document.createElement('div')
        container.dataset.liveMapRoot = 'true'
        container.className = className
        container.style.minHeight = '280px'
        wrapper.prepend(container)
      }

      if (!mapRef.current) {
        resetLeafletContainer(container)
        const map = L.map(container, {
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: true,
        })
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map)
        layerRef.current = L.layerGroup().addTo(map)
        mapRef.current = map
        map.setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], 5)

        resizeObserver = new ResizeObserver(() => {
          mapRef.current?.invalidateSize()
        })
        resizeObserver.observe(container)
      }

      const map = mapRef.current
      const layer = layerRef.current
      if (!map || !layer) return

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
      }

      const allApproximate = pins.every((p) => p.approximate)
      if (bounds.length === 1) {
        map.setView(bounds[0], allApproximate ? 8 : 14)
      } else {
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: allApproximate ? 6 : 14 })
      }

      window.setTimeout(() => map.invalidateSize(), 80)
    })()

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
    }
  }, [pins, selectedVisitorId, className])

  useEffect(() => {
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  return (
    <div ref={wrapperRef} className="relative" style={{ minHeight: pins.length > 0 ? 280 : undefined }}>
      {pins.length === 0 && (
        <div
          className={`${className} flex items-center justify-center bg-[#0d1117] text-xs text-gray-500`}
          style={{ minHeight: 280 }}
        >
          {emptyLabel}
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
