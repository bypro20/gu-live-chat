'use client'

import { useEffect, useRef } from 'react'
import {
  playInboxNotificationSound,
  requestDesktopNotificationPermission,
  showDesktopNotification,
  unlockInboxAudio,
} from '@/lib/inbox-sound'

interface ConversationLike {
  id: string
  unreadCount: number
  lastMessagePreview: string | null
  visitor: { name: string | null; email: string | null }
}

export function useInboxSoundAlert(
  conversations: ConversationLike[],
  enabled: boolean = true,
  /** Socket bağlıyken anlık ses zaten çalıyor — polling yedek sesini kapat */
  skipWhenSocketLive = false
) {
  const prevUnreadRef = useRef(0)
  const prevIdsRef = useRef<Set<string>>(new Set())
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!enabled) return
    unlockInboxAudio()
    requestDesktopNotificationPermission()
  }, [enabled])

  useEffect(() => {
    if (!enabled || skipWhenSocketLive) return

    const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0)
    const currentIds = new Set(conversations.map((c) => c.id))

    if (!initializedRef.current) {
      initializedRef.current = true
      prevUnreadRef.current = totalUnread
      prevIdsRef.current = currentIds
      return
    }

    const newConversations = conversations.filter((c) => !prevIdsRef.current.has(c.id))
    const unreadIncreased = totalUnread > prevUnreadRef.current

    if (unreadIncreased || newConversations.length > 0) {
      playInboxNotificationSound()
      const latest = newConversations[0] || conversations.find((c) => c.unreadCount > 0)
      if (latest) {
        const name = latest.visitor.name || latest.visitor.email?.split('@')[0] || 'Ziyaretçi'
        const preview = latest.lastMessagePreview || 'Yeni mesaj'
        showDesktopNotification(`Yeni mesaj: ${name}`, preview)
      }
    }

    prevUnreadRef.current = totalUnread
    prevIdsRef.current = currentIds
  }, [conversations, enabled, skipWhenSocketLive])
}

/** Socket'ten gelen tekil mesaj için anında ses (mesajla eşzamanlı). */
export function playNewMessageSound(enabled: boolean, senderType: string): void {
  if (!enabled) return
  if (senderType !== 'VISITOR') return
  unlockInboxAudio()
  playInboxNotificationSound()
}
