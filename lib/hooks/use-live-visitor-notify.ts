'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  playVisitorNotificationSound,
  requestDesktopNotificationPermission,
  showVisitorDesktopNotification,
  unlockInboxAudio,
} from '@/lib/inbox-sound'
import { connectSocket, getSocket, isSocketEnabled } from '@/lib/socket-client'
import { useSocket } from '@/lib/hooks/use-socket'
import { emitAgentSocketAuth } from '@/lib/socket-agent-auth'
import { useToast } from '@/lib/toast'
import { getBrowserLabel, getDeviceLabel } from '@/lib/visitors-utils'
import type { LiveVisitor } from '@/lib/stores/live-visitors-store'

export interface VisitorOnlinePayload {
  visitorId: string
  websiteId: string
  name?: string | null
  email?: string | null
  country?: string | null
  city?: string | null
  region?: string | null
  browser?: string | null
  os?: string | null
  device?: string | null
  websiteName?: string | null
  currentPage?: string | null
  currentTitle?: string | null
  connectedAt?: string
}

interface UseLiveVisitorNotifyOptions {
  enabled?: boolean
  variant: 'admin' | 'dashboard'
  userId?: string | null
  websiteId?: string | null
  websiteIds?: string[]
}

function formatVisitorNotifyBody(payload: VisitorOnlinePayload): string {
  const parts: string[] = []
  const location = [payload.city, payload.region, payload.country].filter(Boolean).join(', ')
  if (location) parts.push(location)
  if (payload.device) parts.push(getDeviceLabel(payload.device))
  if (payload.browser) parts.push(getBrowserLabel(payload.browser))
  const page = payload.currentTitle || payload.currentPage
  if (page) parts.push(page)
  return parts.join(' · ') || 'Sitenizde geziniyor'
}

export function useLiveVisitorNotify({
  enabled = true,
  variant,
  userId,
  websiteId = null,
  websiteIds = [],
}: UseLiveVisitorNotifyOptions) {
  const pathname = usePathname()
  const { toast } = useToast()
  const { emit, on } = useSocket()
  const [liveCount, setLiveCount] = useState(0)
  const knownLiveRef = useRef(new Set<string>())
  const notifyReadyRef = useRef(false)
  const upgradeBlockedRef = useRef(false)

  const visitorsPath = variant === 'admin' ? '/admin/visitors' : '/visitors'

  const notifyNewVisitor = useCallback(
    (payload: VisitorOnlinePayload) => {
      const name = payload.name?.trim() || 'Anonim'
      const body = formatVisitorNotifyBody(payload)
      const title =
        variant === 'admin' && payload.websiteName
          ? `Yeni ziyaretçi — ${payload.websiteName}`
          : 'Yeni ziyaretçi'

      playVisitorNotificationSound()
      showVisitorDesktopNotification(title, `${name} · ${body}`)
      toast({
        title,
        description: `${name} — ${body}`,
        variant: 'info',
        duration: 8000,
      })
    },
    [toast, variant]
  )

  const ingestLiveVisitors = useCallback(
    (visitors: LiveVisitor[], notify: boolean) => {
      const liveVisitors = visitors.filter((v) => v.isLive)
      setLiveCount(liveVisitors.length)

      const liveIds = new Set(liveVisitors.map((v) => v.visitorId))
      for (const id of [...knownLiveRef.current]) {
        if (!liveIds.has(id)) knownLiveRef.current.delete(id)
      }

      if (!notify || !notifyReadyRef.current) {
        liveVisitors.forEach((v) => knownLiveRef.current.add(v.visitorId))
        notifyReadyRef.current = true
        return
      }

      for (const visitor of liveVisitors) {
        if (knownLiveRef.current.has(visitor.visitorId)) continue
        knownLiveRef.current.add(visitor.visitorId)
        notifyNewVisitor({
          visitorId: visitor.visitorId,
          websiteId: visitor.websiteId || websiteId || '',
          name: visitor.name,
          country: visitor.country,
          city: visitor.city,
          region: visitor.region,
          browser: visitor.browser,
          os: visitor.os,
          device: visitor.device,
          websiteName: visitor.websiteName,
          currentPage: visitor.currentPage,
          currentTitle: visitor.currentTitle,
        })
      }
    },
    [notifyNewVisitor, websiteId]
  )

  const pollLiveVisitors = useCallback(async () => {
    if (!enabled || upgradeBlockedRef.current) return

    try {
      const url =
        variant === 'admin'
          ? '/api/admin/visitors/live'
          : `/api/visitors/live${websiteId ? `?websiteId=${encodeURIComponent(websiteId)}` : ''}`

      const res = await fetch(url)
      if (variant === 'dashboard' && res.status === 403) {
        const data = await res.json().catch(() => ({}))
        if (data.upgradeRequired) {
          upgradeBlockedRef.current = true
          setLiveCount(0)
          return
        }
      }
      if (!res.ok) return

      const data = await res.json()
      ingestLiveVisitors(data.visitors || [], true)
    } catch {
      // ignore polling errors
    }
  }, [enabled, variant, websiteId, ingestLiveVisitors])

  useEffect(() => {
    if (!enabled || !userId) return

    unlockInboxAudio()
    requestDesktopNotificationPermission()

    notifyReadyRef.current = false
    knownLiveRef.current.clear()
    upgradeBlockedRef.current = false

    void pollLiveVisitors()
    const pollId = setInterval(pollLiveVisitors, 15000)
    return () => clearInterval(pollId)
  }, [enabled, userId, websiteId, variant, pollLiveVisitors])

  useEffect(() => {
    if (!enabled || !userId || upgradeBlockedRef.current) return

    const socket = getSocket() || connectSocket()
    const authenticate = () => {
      if (variant === 'admin') {
        void emitAgentSocketAuth(emit, [], 'platform')
      } else {
        const ids = websiteIds.length > 0 ? websiteIds : websiteId ? [websiteId] : []
        if (ids.length === 0) return
        void emitAgentSocketAuth(emit, ids)
      }
    }

    if (socket?.connected) authenticate()
    else socket?.on('connect', authenticate)

    const handleVisitorOnline = (data: VisitorOnlinePayload) => {
      if (variant === 'dashboard' && websiteId && data.websiteId !== websiteId) return

      if (!notifyReadyRef.current) {
        knownLiveRef.current.add(data.visitorId)
        return
      }

      if (knownLiveRef.current.has(data.visitorId)) return
      knownLiveRef.current.add(data.visitorId)
      notifyNewVisitor(data)
      void pollLiveVisitors()
    }

    const handleVisitorOffline = (data: { visitorId?: string }) => {
      if (!data.visitorId) return
      knownLiveRef.current.delete(data.visitorId)
      void pollLiveVisitors()
    }

    const unsubs = [
      on('agent:visitor:online', handleVisitorOnline as (...args: unknown[]) => void),
      on('agent:visitor:offline', handleVisitorOffline as (...args: unknown[]) => void),
    ]

    return () => {
      socket?.off('connect', authenticate)
      unsubs.forEach((u) => u())
    }
  }, [
    enabled,
    userId,
    variant,
    websiteId,
    websiteIds,
    emit,
    on,
    notifyNewVisitor,
    pollLiveVisitors,
  ])

  return {
    liveCount,
    isTracking: enabled && !upgradeBlockedRef.current,
    visitorsPath,
    isOnVisitorsPage: pathname?.startsWith(visitorsPath) ?? false,
    socketEnabled: isSocketEnabled(),
  }
}
