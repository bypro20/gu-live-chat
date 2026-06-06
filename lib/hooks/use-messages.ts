'use client'

import useSWR from 'swr'
import { useState, useCallback, useEffect } from 'react'
import { connectSocket, isSocketConnected, isSocketEnabled } from '@/lib/socket-client'

// Poll fast (~2s) when relying on REST polling; back off to a safety-net
// interval when a live socket connection is carrying realtime updates.
const POLL_FAST_MS = 2000
const POLL_IDLE_MS = 30000

// ─── Types ──────────────────────────────────────────────────────────

export interface Message {
  id: string
  conversationId: string
  content: string
  type: string
  senderType: string
  senderId: string | null
  createdAt: string
  readAt: string | null
  attachments: Array<{
    id: string
    url: string
    filename: string
    mimetype: string
    size: number
  }>
}

interface MessagesResponse {
  messages: Message[]
  total: number
}

// ─── Fetcher ────────────────────────────────────────────────────────

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to fetch')
  }
  return res.json()
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useMessages(conversationId: string | null) {
  const [sending, setSending] = useState(false)
  const [pollInterval, setPollInterval] = useState(
    isSocketEnabled() ? POLL_IDLE_MS : POLL_FAST_MS
  )

  useEffect(() => {
    // No socket server configured → always rely on fast polling.
    if (!isSocketEnabled()) {
      setPollInterval(POLL_FAST_MS)
      return
    }
    connectSocket()
    const update = () =>
      setPollInterval(isSocketConnected() ? POLL_IDLE_MS : POLL_FAST_MS)
    update()
    const id = setInterval(update, 5000)
    return () => clearInterval(id)
  }, [])

  const { data, error, mutate, isLoading } = useSWR<MessagesResponse>(
    // Key is null for unselected conversations, so SWR only polls the
    // active/selected conversation — background ones are not fetched.
    conversationId ? `/api/conversations/${conversationId}/messages` : null,
    fetcher,
    {
      refreshInterval: pollInterval,
      // Pause polling while the tab is hidden/unfocused; refetch on return.
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      dedupingInterval: 1000,
    }
  )

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || !content.trim()) return

    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'TEXT' }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Mesaj gönderilemedi')
      }

      // Revalidate messages
      mutate()
    } finally {
      setSending(false)
    }
  }, [conversationId, mutate])

  return {
    messages: data?.messages || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate,
    sendMessage,
    sending,
  }
}