'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

const INIT_KEY = 'gu-panel-theme-init-v3'

/** Panel açılışında bir kez açık (Ahizem iş paneli) temaya döner; sonrası kullanıcının tercihidir. */
export function PanelBoot() {
  const { setTheme } = useTheme()
  useEffect(() => {
    try {
      if (!localStorage.getItem(INIT_KEY)) {
        localStorage.setItem(INIT_KEY, '1')
        setTheme('light')
      }
    } catch {
      // gizli mod
    }
  }, [setTheme])
  return null
}
