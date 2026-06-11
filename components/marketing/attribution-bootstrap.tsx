'use client'

import { useEffect } from 'react'
import { captureAttributionFromCurrentUrl } from '@/lib/marketing-attribution-client'

/** İlk ziyarette UTM/ref parametrelerini localStorage'a kaydeder */
export function AttributionBootstrap() {
  useEffect(() => {
    captureAttributionFromCurrentUrl()
  }, [])
  return null
}
