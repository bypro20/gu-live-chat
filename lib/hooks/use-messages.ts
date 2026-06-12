'use client'

import useSWR from 'swr'
import { useState, useCallback, useEffect } from 'react'
import { connectSocket, isSocketConnected, isSocketEnabled } from '@/lib/socket-client'

const POLL_FAST_MS = 3000
const POLL_IDLE_MS = 20000

export interface Message {
  id: string
  conversationId: string
  content: string
  type: string
  senderType: string
  senderId: string | null
  sentiment?: string | null
  createdAt: string
  readAt: string | null
  attachments: Array<{
    id: string
    url: string
    filename: string
    mimetype: string
    size: number
  }>
  sender?: { id: string; name: string | null; image: string | null } | null
}

export type SendAttachment = {
  url: string
  fileName: string
  fileSize?: number
  mimeType?: string
}

interface MessagesResponse {
  messages: Message[]
  total: number
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to fetch')
  }
  return res.json()
}

export function useMessages(conversationId: string | null) {
  const [sending, setSending] = useState(false)
  const [pollInterval, setPollInterval] = useState(
    isSocketEnabled() ? POLL_IDLE_MS : POLL_FAST_MS
  )

  useEffect(() => {
    if (!isSocketEnabled()) {
      setPollInterval(POLL_FAST_MS)
      return
    }
    connectSocket()
    const update = () =>
      setPollInterval(isSocketConnected() ? 0 : POLL_FAST_MS)
    update()
    const id = setInterval(update, 5000)
    return () => clearInterval(id)
  }, [])

  const { data, error, mutate, isLoading } = useSWR<MessagesResponse>(
    conversationId ? `/api/conversations/${conversationId}/messages` : null,
    fetcher,
    {
      refreshInterval: pollInterval,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      dedupingInterval: 800,
    }
  )

  const sendMessage = useCallback(
    async (content: string, options?: { type?: string; attachment?: SendAttachment }) => {
      if (!conversationId) return
      const trimmed = content.trim()
      if (!trimmed && !options?.attachment) return

      const type = options?.type || (options?.attachment ? 'IMAGE' : 'TEXT')
      const optimisticId = `opt_${Date.now()}`
      setSending(true)

      mutate(
        (current) => {
          if (!current) return current
          return {
            ...current,
            messages: [
              ...current.messages,
              {
                id: optimisticId,
                conversationId,
                content: trimmed || (options?.attachment?.fileName ?? ''),
                type,
                senderType: 'AGENT',
                senderId: null,
                createdAt: new Date().toISOString(),
                readAt: null,
                attachments: options?.attachment
                  ? [
                      {
                        id: 'opt',
                        url: options.attachment.url,
                        filename: options.attachment.fileName,
                        mimetype: options.attachment.mimeType || '',
                        size: options.attachment.fileSize || 0,
                      },
                    ]
                  : [],
              },
            ],
          }
        },
        { revalidate: false }
      )

      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: trimmed,
            type,
            ...(options?.attachment ? { attachment: options.attachment } : {}),
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Mesaj gönderilemedi')
        }

        const saved = await res.json()
        mutate(
          (current) => {
            if (!current) return current
            return {
              ...current,
              messages: current.messages.map((m) =>
                m.id === optimisticId
                  ? {
                      ...m,
                      id: saved.id,
                      senderId: saved.senderId ?? saved.sender?.id ?? null,
                      createdAt: saved.createdAt,
                      content: saved.content,
                      type: saved.type,
                      attachments: saved.attachments ?? [],
                    }
                  : m
              ),
            }
          },
          { revalidate: true }
        )
      } catch (err) {
        mutate(
          (current) => {
            if (!current) return current
            return {
              ...current,
              messages: current.messages.filter((m) => m.id !== optimisticId),
            }
          },
          { revalidate: false }
        )
        throw err
      } finally {
        setSending(false)
      }
    },
    [conversationId, mutate]
  )

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
