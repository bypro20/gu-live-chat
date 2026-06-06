'use client'

import useSWR from 'swr'
import { useEffect, useState } from 'react'
import { connectSocket, isSocketConnected } from '@/lib/socket-client'
import { useActiveWebsite } from './use-active-website'

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
}) {
  const { activeWebsite } = useActiveWebsite()
  const [pollInterval, setPollInterval] = useState(30000)

  useEffect(() => {
    connectSocket()
    const update = () => setPollInterval(isSocketConnected() ? 30000 : 4000)
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
  if (activeWebsite?.websiteId) params.set('websiteId', activeWebsite.websiteId)

  const query = params.toString()
  const url = `/api/conversations${query ? `?${query}` : ''}`

  const { data, error, mutate, isLoading } = useSWR<ConversationsResponse>(
    activeWebsite ? url : null,
    fetcher,
    {
      refreshInterval: pollInterval,
      revalidateOnFocus: true,
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