'use client'

import { useEffect, useState } from 'react'
import { getNativeAppPlatform, type NativeAppPlatform } from '@/lib/native-app'

export function useNativeApp() {
  const [platform, setPlatform] = useState<NativeAppPlatform | null>(null)

  useEffect(() => {
    setPlatform(getNativeAppPlatform())
  }, [])

  return {
    isNativeApp: platform !== null,
    platform,
  }
}
