'use client'

import useSWR from 'swr'
import { useCallback, useEffect, useState } from 'react'
import { connectSocket, isSocketConnected, isSocketEnabled } from '@/lib/socket-client'
import type { SendAttachment } from '@/lib/hooks/use-messages'

const POLL_LIST_MS = 2000
const POLL_MSG_MS = 3000
const POLL_IDLE_MS = 30000

export interface AdminConversation {
  id: string
  websiteId: string
  visitorId: string
  status: string
  source?: string
  visitorLang?: string | null
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
    const update = () => setInterval(isSocketConnected() ? 0 : fastMs)
    update()
    const id = window.setInterval(update, 3000)
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
        const res = await fetch(
          `/api/admin/inbox/conversations/${conversationId}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              content: trimmed,
              type,
              ...(options?.attachment ? { attachment: options.attachment } : {}),
            }),
          }
        )
        const saved = await res.json()
        if (!res.ok) throw new Error(saved.error || 'Gönderilemedi')

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
        return saved
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
    isLoading,
    error,
    mutate,
    sendMessage,
    sending,
    pollInterval,
  }
}
