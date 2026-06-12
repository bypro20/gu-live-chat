'use client'

import { useEffect, useRef } from 'react'

export function useInboxDesktopNotify(
  enabled: boolean,
  unreadTotal: number,
  latestPreview?: string | null
) {
  const prevUnread = useRef(0)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || unreadTotal <= prevUnread.current) {
      prevUnread.current = unreadTotal
      return
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      prevUnread.current = unreadTotal
      return
    }

    if (Notification.permission === 'granted') {
      try {
        new Notification('Yeni mesaj — Gu Live Chat', {
          body: latestPreview || 'Gelen kutunuzda okunmamış mesaj var',
          icon: '/favicon.ico',
          tag: 'guchat-inbox',
        })
      } catch {
        /* ignore */
      }
    }

    prevUnread.current = unreadTotal
  }, [enabled, unreadTotal, latestPreview])
}
