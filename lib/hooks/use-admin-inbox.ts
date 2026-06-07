'use client'

import useSWR from 'swr'
import { useCallback, useEffect, useState } from 'react'
import { connectSocket, isSocketConnected, isSocketEnabled } from '@/lib/socket-client'

const POLL_LIST_MS = 1000
const POLL_MSG_MS = 800
const POLL_IDLE_MS = 4000

export interface AdminConversation {
  id: string
  websiteId: string
  visitorId: string
  status: string
  lastMessageAt: string
  lastMessagePreview: string | null
  unreadCount: number
  visitor: {
    id: string
    name: string | null
    email: string | null
    avatarUrl: string | null
  }
}

export interface AdminMessage {
  id: string
  conversationId: string
  content: string
  type: string
  senderType: string
  senderId: string | null
  createdAt: string
  readAt: string | null
  attachments: Array<{ id: string; url: string; filename: string; mimetype: string; size: number }>
}

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'İstek başarısız')
  return data
}

function usePollInterval(fastMs: number, idleMs: number) {
  const [interval, setInterval] = useState(isSocketEnabled() ? idleMs : fastMs)

  useEffect(() => {
    if (!isSocketEnabled()) {
      setInterval(fastMs)
      return
    }
    connectSocket()
    const update = () => setInterval(isSocketConnected() ? idleMs : fastMs)
    update()
    const id = window.setInterval(update, 2000)
    return () => window.clearInterval(id)
  }, [fastMs, idleMs])

  return interval
}

export function useAdminInboxConversations(enabled: boolean) {
  const pollInterval = usePollInterval(POLL_LIST_MS, POLL_IDLE_MS)

  const { data, error, mutate, isLoading } = useSWR<{ conversations: AdminConversation[] }>(
    enabled ? '/api/admin/inbox/conversations?limit=50' : null,
    fetcher,
    {
      refreshInterval: pollInterval,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      dedupingInterval: 400,
    }
  )

  return {
    conversations: data?.conversations || [],
    isLoading,
    error,
    mutate,
    pollInterval,
  }
}

export function useAdminInboxMessages(conversationId: string | null) {
  const [sending, setSending] = useState(false)
  const pollInterval = usePollInterval(POLL_MSG_MS, POLL_MSG_MS)

  const { data, error, mutate, isLoading } = useSWR<{ messages: AdminMessage[] }>(
    conversationId
      ? `/api/admin/inbox/conversations/${conversationId}/messages`
      : null,
    fetcher,
    {
      refreshInterval: pollInterval,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      dedupingInterval: 300,
    }
  )

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim()) return
      const trimmed = content.trim()
      setSending(true)
      try {
        const res = await fetch(
          `/api/admin/inbox/conversations/${conversationId}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content: trimmed, type: 'TEXT' }),
          }
        )
        const saved = await res.json()
        if (!res.ok) throw new Error(saved.error || 'Gönderilemedi')
        await mutate()
        return saved
      } finally {
        setSending(false)
      }
    },
    [conversationId, mutate]
  )

  return {
    messages: data?.messages || [],
    isLoading,
    error,
    mutate,
    sendMessage,
    sending,
    pollInterval,
  }
}
