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

export function useTeam() {
  const { activeWebsite } = useActiveWebsite()

  const { data, error, mutate, isLoading } = useSWR(
    activeWebsite ? `/api/team?websiteId=${activeWebsite.websiteId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const inviteMember = async (email: string, role: string) => {
    if (!activeWebsite) throw new Error('Aktif site seçili değil')

    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, websiteId: activeWebsite.websiteId }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Davet gönderilemedi')
    }

    mutate()
    return res.json()
  }

  const removeMember = async (memberId: string) => {
    const res = await fetch(`/api/team/${memberId}?websiteId=${activeWebsite?.websiteId}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Üye kaldırılamadı')
    }

    mutate()
  }

  const updateMemberRole = async (memberId: string, role: string) => {
    const res = await fetch(`/api/team/${memberId}?websiteId=${activeWebsite?.websiteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Rol güncellenemedi')
    }

    mutate()
  }

  return {
    members: data?.team || data?.members || [],
    pendingInvites: data?.pendingInvites || [],
    isLoading,
    error,
    mutate,
    inviteMember,
    removeMember,
    updateMemberRole,
  }
}