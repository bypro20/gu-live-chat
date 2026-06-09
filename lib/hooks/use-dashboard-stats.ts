'use client'

import useSWR from 'swr'
import { useActiveWebsite } from './use-active-website'

export interface ChannelStat {
  source: string
  label: string
  count: number
}

export interface AgentStat {
  userId: string | null
  name: string
  image: string | null
  messagesSent: number
  resolved: number
}

interface DashboardStats {
  openConversations: number
  todayConversations: number
  activeVisitors: number
  avgResponseTime: string
  totalConversations: number
  resolvedConversations: number
  channelBreakdown: ChannelStat[]
  agentPerformance: AgentStat[]
  aiAgent: { active: boolean; autoReply: boolean }
  aiMetrics: { botReplies: number; aiResolved: number; aiResolutionRate: number }
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to fetch')
  }
  return res.json()
}

const EMPTY: DashboardStats = {
  openConversations: 0,
  todayConversations: 0,
  activeVisitors: 0,
  avgResponseTime: '-',
  totalConversations: 0,
  resolvedConversations: 0,
  channelBreakdown: [],
  agentPerformance: [],
  aiAgent: { active: false, autoReply: false },
  aiMetrics: { botReplies: 0, aiResolved: 0, aiResolutionRate: 0 },
}

export function useDashboardStats() {
  const { activeWebsite } = useActiveWebsite()

  const params = new URLSearchParams()
  if (activeWebsite?.websiteId) params.set('websiteId', activeWebsite.websiteId)
  const url = activeWebsite?.websiteId ? `/api/dashboard/stats?${params}` : null

  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(url, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  return {
    stats: data || EMPTY,
    isLoading,
    error,
    mutate,
  }
}
