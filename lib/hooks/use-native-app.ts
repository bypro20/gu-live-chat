'use client'

import { useState } from 'react'
import {
  getNativeAppPlatform,
  type NativeAppPlatform,
} from '@/lib/native-app'

function readNativePlatform(): NativeAppPlatform | null {
  if (typeof window === 'undefined') return null
  return getNativeAppPlatform()
}

export function useNativeApp() {
  const [platform] = useState<NativeAppPlatform | null>(readNativePlatform)

  return {
    isNativeApp: platform !== null,
    isNativeAdminApp: platform === 'admin',
    isNativeCustomerApp: platform === 'android' || platform === 'ios',
    platform,
  }
}
