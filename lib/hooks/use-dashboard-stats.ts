'use client'

import useSWR from 'swr'
import { useActiveWebsite } from './use-active-website'

interface DashboardStats {
  openConversations: number
  todayConversations: number
  activeVisitors: number
  avgResponseTime: string
  totalConversations: number
  resolvedConversations: number
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to fetch')
  }
  return res.json()
}

export function useDashboardStats() {
  const { activeWebsite } = useActiveWebsite()

  const params = new URLSearchParams()
  if (activeWebsite?.websiteId) params.set('websiteId', activeWebsite.websiteId)
  const query = params.toString()
  const url = `/api/dashboard/stats${query ? `?${query}` : ''}`

  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    url,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  )

  return {
    stats: data || {
      openConversations: 0,
      todayConversations: 0,
      activeVisitors: 0,
      avgResponseTime: '-',
      totalConversations: 0,
      resolvedConversations: 0,
    },
    isLoading,
    error,
    mutate,
  }
}