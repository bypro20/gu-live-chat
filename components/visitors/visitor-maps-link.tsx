'use client'

import { ExternalLink, MapPin } from 'lucide-react'
import type { LiveVisitor } from '@/lib/stores/live-visitors-store'
import { resolveVisitorMapsUrl } from '@/lib/visitor-live-geo'
import { formatVisitorGeoLine } from '@/lib/visitor-session-enrich'

type VisitorMapsLinkProps = {
  visitor: Pick<
    LiveVisitor,
    | 'latitude'
    | 'longitude'
    | 'country'
    | 'city'
    | 'region'
    | 'geoAddress'
    | 'name'
  >
  className?: string
  label?: string
}

export function VisitorMapsLink({
  visitor,
  className = 'inline-flex items-center gap-1 text-[11px] font-medium text-violet-400 hover:text-violet-300',
  label = 'Konuma git',
}: VisitorMapsLinkProps) {
  const url = resolveVisitorMapsUrl({
    ...visitor,
    geoAddress: visitor.geoAddress || formatVisitorGeoLine(visitor) || null,
  })
  if (!url) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={(e) => e.stopPropagation()}
    >
      <MapPin className="w-3 h-3 shrink-0" />
      {label}
      <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
    </a>
  )
}
