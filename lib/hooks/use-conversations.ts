'use client'

import useSWR from 'swr'
import { useEffect, useState } from 'react'
import { connectSocket, isSocketConnected, isSocketEnabled } from '@/lib/socket-client'
import { useActiveWebsite } from './use-active-website'

// Conversation list refresh cadence: ~5s while polling, backing off when a
// live socket connection is already streaming new conversations/messages.
const POLL_LIST_MS = 2000
const POLL_IDLE_MS = 15000

// ─── Types ──────────────────────────────────────────────────────────

export interface ConversationMessage {
  id: string
  content: string
  type: string
  senderType: string
  createdAt: string
  readAt: string | null
  senderId: string | null
  senderName: string | null
}

export interface Conversation {
  id: string
  websiteId: string
  visitorId: string
  status: string
  source: string
  subject: string | null
  lastMessageAt: string
  lastMessagePreview: string | null
  unreadCount: number
  createdAt: string
  updatedAt: string
  closedAt: string | null
  visitor: {
    id: string
    name: string | null
    email: string | null
    avatarUrl: string | null
  }
  assignedTo: {
    id: string
    name: string | null
    image: string | null
  } | null
  tags: Array<{ tag: { id: string; name: string; color: string } }>
  _count: {
    messages: number
  }
}

interface ConversationsResponse {
  conversations: Conversation[]
  total: number
  page: number
  totalPages: number
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

export function useConversations(options?: {
  status?: string
  assignedTo?: string
  search?: string
  page?: number
  limit?: number
  /** true = tüm sitelerdeki sohbetler (websiteId filtresi yok) */
  allWebsites?: boolean
  /** Sabit public websiteId (admin gelen kutusu vb.) */
  websiteId?: string
}) {
  const { activeWebsite } = useActiveWebsite()
  const [pollInterval, setPollInterval] = useState(
    isSocketEnabled() ? POLL_IDLE_MS : POLL_LIST_MS
  )

  useEffect(() => {
    // No socket server configured → always rely on list polling.
    if (!isSocketEnabled()) {
      setPollInterval(POLL_LIST_MS)
      return
    }
    connectSocket()
    const update = () =>
      setPollInterval(isSocketConnected() ? POLL_IDLE_MS : POLL_LIST_MS)
    update()
    const id = setInterval(update, 5000)
    return () => clearInterval(id)
  }, [])

  const params = new URLSearchParams()
  if (options?.status && options.status !== 'all') params.set('status', options.status)
  if (options?.assignedTo) params.set('assignedTo', options.assignedTo)
  if (options?.search) params.set('search', options.search)
  if (options?.page) params.set('page', String(options.page))
  if (options?.limit) params.set('limit', String(options.limit))
  const pinnedWebsiteId = options?.websiteId || (!options?.allWebsites ? activeWebsite?.websiteId : undefined)
  const scopeReady = options?.allWebsites || pinnedWebsiteId
  if (options?.websiteId) {
    params.set('websiteId', options.websiteId)
  } else if (!options?.allWebsites && activeWebsite?.websiteId) {
    params.set('websiteId', activeWebsite.websiteId)
  }

  const query = params.toString()
  const url = `/api/conversations${query ? `?${query}` : ''}`

  const { data, error, mutate, isLoading } = useSWR<ConversationsResponse>(
    scopeReady ? url : null,
    fetcher,
    {
      refreshInterval: pollInterval,
      // Pause list polling while the tab is hidden; refetch on return.
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  )

  return {
    conversations: data?.conversations || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 1,
    isLoading,
    error,
    mutate,
  }
}