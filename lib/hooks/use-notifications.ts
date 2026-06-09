'use client'

import useSWR from 'swr'
import { useState, useCallback } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: string | null
  readAt: string | null
  websiteId: string
  createdAt: string
}

interface NotificationsResponse {
  notifications: Notification[]
  unreadCount: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useNotifications() {
  const [markingAsRead, setMarkingAsRead] = useState(false)

  const { data, error, mutate } = useSWR<NotificationsResponse>(
    '/api/notifications',
    fetcher,
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
    }
  )

  const markAsRead = useCallback(
    async (notificationIds: string[]) => {
      setMarkingAsRead(true)
      try {
        const res = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds }),
        })
        if (res.ok) {
          mutate()
        }
      } catch (err) {
        console.error('Failed to mark notifications as read:', err)
      } finally {
        setMarkingAsRead(false)
      }
    },
    [mutate]
  )

  const markAllAsRead = useCallback(async () => {
    setMarkingAsRead(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      if (res.ok) {
        mutate()
      }
    } catch (err) {
      console.error('Failed to mark notifications as read:', err)
    } finally {
      setMarkingAsRead(false)
    }
  }, [mutate])

  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/notifications/${id}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          mutate()
        }
      } catch (err) {
        console.error('Failed to delete notification:', err)
      }
    },
    [mutate]
  )

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading: !error && !data,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    markingAsRead,
    mutate,
  }
}