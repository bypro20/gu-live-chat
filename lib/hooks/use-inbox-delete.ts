'use client'

import { useCallback, useState } from 'react'
import { stopPersistentInboxAlertsForConversation } from '@/lib/inbox-persistent-alert'

type InboxDeleteScope = 'dashboard' | 'admin'

function conversationBase(scope: InboxDeleteScope) {
  return scope === 'admin' ? '/api/admin/inbox/conversations' : '/api/conversations'
}

export function useInboxDelete(scope: InboxDeleteScope = 'dashboard') {
  const [deleting, setDeleting] = useState(false)
  const base = conversationBase(scope)

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      setDeleting(true)
      try {
        const res = await fetch(`${base}/${conversationId}`, { method: 'DELETE' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Silinemedi')
        stopPersistentInboxAlertsForConversation(conversationId)
        return true
      } finally {
        setDeleting(false)
      }
    },
    [base]
  )

  const deleteConversations = useCallback(
    async (conversationIds: string[]) => {
      if (conversationIds.length === 0) return 0
      setDeleting(true)
      try {
        const res = await fetch(`${base}/bulk-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: conversationIds }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Silinemedi')
        for (const id of conversationIds) stopPersistentInboxAlertsForConversation(id)
        return (data.deleted as number) ?? conversationIds.length
      } finally {
        setDeleting(false)
      }
    },
    [base]
  )

  const deleteMessage = useCallback(
    async (conversationId: string, messageId: string) => {
      setDeleting(true)
      try {
        const res = await fetch(`${base}/${conversationId}/messages/${messageId}`, {
          method: 'DELETE',
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Mesaj silinemedi')
        return true
      } finally {
        setDeleting(false)
      }
    },
    [base]
  )

  return { deleting, deleteConversation, deleteConversations, deleteMessage }
}
