'use client'

import useSWR from 'swr'
import { useActiveWebsite } from './use-active-website'

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to fetch')
  }
  return res.json()
}

export function useWebsite() {
  const { activeWebsite, refreshWebsites } = useActiveWebsite()

  const { data, error, mutate, isLoading } = useSWR(
    activeWebsite ? `/api/websites/${activeWebsite.websiteId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const updateWebsite = async (updates: Record<string, unknown>) => {
    if (!activeWebsite) return

    const res = await fetch(`/api/websites/${activeWebsite.websiteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Güncelleme başarısız')
    }

    mutate()
    refreshWebsites()
    return res.json()
  }

  return {
    website: data,
    isLoading,
    error,
    updateWebsite,
    mutate,
  }
}