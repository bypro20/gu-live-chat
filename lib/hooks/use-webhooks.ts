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

export function useWebhooks() {
  const { activeWebsite } = useActiveWebsite()

  const { data, error, mutate, isLoading } = useSWR(
    activeWebsite ? `/api/webhooks?websiteId=${activeWebsite.websiteId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const createWebhook = async (url: string, events: string[]) => {
    if (!activeWebsite) throw new Error('Aktif site seçili değil')

    const res = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, events, websiteId: activeWebsite.websiteId }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Webhook oluşturulamadı')
    }

    mutate()
    return res.json()
  }

  const deleteWebhook = async (webhookId: string) => {
    const res = await fetch(`/api/webhooks/${webhookId}?websiteId=${activeWebsite?.websiteId}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Webhook silinemedi')
    }

    mutate()
  }

  return {
    webhooks: data?.webhooks || data || [],
    isLoading,
    error,
    mutate,
    createWebhook,
    deleteWebhook,
  }
}