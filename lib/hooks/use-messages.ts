'use client'

import useSWR from 'swr'
import { useState, useCallback, useEffect } from 'react'
import { connectSocket, isSocketConnected } from '@/lib/socket-client'

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
  const [pollInterval, setPollInterval] = useState(30000)

  useEffect(() => {
    connectSocket()
    const update = () => setPollInterval(isSocketConnected() ? 30000 : 4000)
    update()
    const id = setInterval(update, 5000)
    return () => clearInterval(id)
  }, [])

  const { data, error, mutate, isLoading } = useSWR<MessagesResponse>(
    conversationId ? `/api/conversations/${conversationId}/messages` : null,
    fetcher,
    {
      refreshInterval: pollInterval,
      revalidateOnFocus: true,
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