'use client'

import { useNativeApp } from '@/lib/hooks/use-native-app'
import { NativeSettingsHub } from '@/components/app/native-settings-hub'
import { GeneralSettingsPanel } from '@/components/dashboard/general-settings-panel'

export default function SettingsPage() {
  const { isNativeCustomerApp } = useNativeApp()

  if (isNativeCustomerApp) {
    return <NativeSettingsHub />
  }

  return <GeneralSettingsPanel />
}
