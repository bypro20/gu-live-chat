'use client'

import type { LiveVisitor } from '@/lib/stores/live-visitors-store'
import { VisitorLiveProfile } from '@/components/visitors/visitor-live-profile'

type VisitorGeoPanelProps = {
  visitor: LiveVisitor
  theme?: 'admin' | 'dashboard'
}

export function VisitorGeoPanel({ visitor, theme = 'admin' }: VisitorGeoPanelProps) {
  return <VisitorLiveProfile visitor={visitor} theme={theme} />
}
