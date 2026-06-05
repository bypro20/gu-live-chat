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

export function useChatbots() {
  const { activeWebsite } = useActiveWebsite()

  const { data, error, mutate, isLoading } = useSWR(
    activeWebsite ? `/api/chatbots?websiteId=${activeWebsite.websiteId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const createChatbot = async (chatbotData: { name: string; triggerType: string; triggerValue?: string; steps: unknown[] }) => {
    if (!activeWebsite) throw new Error('Aktif site seçili değil')

    const res = await fetch('/api/chatbots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...chatbotData, websiteId: activeWebsite.websiteId }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Chatbot oluşturulamadı')
    }

    mutate()
    return res.json()
  }

  const deleteChatbot = async (chatbotId: string) => {
    const res = await fetch(`/api/chatbots/${chatbotId}?websiteId=${activeWebsite?.websiteId}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Chatbot silinemedi')
    }

    mutate()
  }

  return {
    chatbots: data?.chatbots || data || [],
    isLoading,
    error,
    mutate,
    createChatbot,
    deleteChatbot,
  }
}