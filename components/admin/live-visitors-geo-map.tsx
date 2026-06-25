'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { LiveVisitor } from '@/lib/stores/live-visitors-store'
import { formatVisitorGeoLine } from '@/lib/visitor-session-enrich'

type LiveVisitorsGeoMapProps = {
  visitors: LiveVisitor[]
  selectedVisitorId?: string | null
  onSelect?: (visitorId: string) => void
  className?: string
  emptyLabel?: string
}

export function LiveVisitorsGeoMap({
  visitors,
  selectedVisitorId,
  onSelect,
  className = 'h-56 w-full rounded-xl overflow-hidden border border-white/[0.08]',
  emptyLabel = 'Henüz konum verisi yok',
}: LiveVisitorsGeoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const layerRef = useRef<import('leaflet').LayerGroup | null>(null)

  const geoVisitors = useMemo(
    () =>
      visitors.filter(
        (v) => typeof v.latitude === 'number' && typeof v.longitude === 'number'
      ),
    [visitors]
  )

  useEffect(() => {
    if (!containerRef.current || geoVisitors.length === 0) return

    let cancelled = false

    ;(async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (cancelled || !containerRef.current) return

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          zoomControl: true,
          attributionControl: true,
        })
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(mapRef.current)
        layerRef.current = L.layerGroup().addTo(mapRef.current)
      }

      const map = mapRef.current
      const layer = layerRef.current
      if (!map || !layer) return

      layer.clearLayers()
      const bounds: [number, number][] = []

      for (const visitor of geoVisitors) {
        const lat = visitor.latitude!
        const lng = visitor.longitude!
        bounds.push([lat, lng])

        const selected = visitor.visitorId === selectedVisitorId
        const marker = L.circleMarker([lat, lng], {
          radius: selected ? 10 : 7,
          color: selected ? '#ffffff' : '#34d399',
          weight: selected ? 2 : 1,
          fillColor: selected ? '#8b5cf6' : '#10b981',
          fillOpacity: 0.92,
        })

        const label = visitor.name || 'Ziyaretçi'
        const address = formatVisitorGeoLine(visitor)
        const entry = visitor.entrySource ? `<br/>Giriş: ${visitor.entrySource}` : ''
        const source =
          visitor.geoSource === 'gps'
            ? ' (GPS)'
            : visitor.geoSource === 'ip'
              ? ' (IP tahmini)'
              : ''

        marker.bindPopup(
          `<strong>${label}</strong><br/>${address}${source}${entry}`
        )
        marker.on('click', () => onSelect?.(visitor.visitorId))
        marker.addTo(layer)
      }

      if (bounds.length === 1) {
        map.setView(bounds[0], 15)
      } else {
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 })
      }

      window.setTimeout(() => map.invalidateSize(), 120)
    })()

    return () => {
      cancelled = true
    }
  }, [geoVisitors, selectedVisitorId, onSelect])

  useEffect(() => {
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  if (geoVisitors.length === 0) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-white/[0.02] text-xs text-gray-500`}
      >
        {emptyLabel}
      </div>
    )
  }

  return <div ref={containerRef} className={className} />
}
