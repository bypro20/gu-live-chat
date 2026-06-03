'use client'

import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'

// ─── Types ──────────────────────────────────────────────────────────

interface UserWebsite {
  id: string
  websiteId: string
  name: string
  domain: string
  plan: string
  subscriptionStatus: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  primaryColor: string | null
  position: string | null
  welcomeMessage: string | null
  offlineMessage: string | null
  avatarUrl: string | null
}

interface UseActiveWebsiteReturn {
  /** Currently active website */
  activeWebsite: UserWebsite | null
  /** All websites the user has access to */
  websites: UserWebsite[]
  /** Whether websites are loading */
  isLoading: boolean
  /** Error if any */
  error: string | null
  /** Switch to a different website */
  switchWebsite: (websiteId: string) => void
  /** Is the user an OWNER or ADMIN of the active website */
  isAdmin: boolean
  /** Is the user the OWNER of the active website */
  isOwner: boolean
  /** Refresh the website list */
  refreshWebsites: () => void
}

// ─── Fetcher ────────────────────────────────────────────────────────

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to fetch websites')
  }
  return res.json()
}

// ─── Storage Key ─────────────────────────────────────────────────────

const STORAGE_KEY = 'gu-active-website-id'

function getStoredWebsiteId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

function setStoredWebsiteId(id: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, id)
}

function clearStoredWebsiteId() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useActiveWebsite(): UseActiveWebsiteReturn {
  const { data: session } = useSession()
  const [localActiveId, setLocalActiveId] = useState<string | null>(getStoredWebsiteId)

  // Fetch all websites the user has access to
  const { data: websites, error, mutate } = useSWR<UserWebsite[]>(
    session?.user?.id ? '/api/websites' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  )

  // Determine the active website
  const activeWebsite = websites?.find(w => w.websiteId === localActiveId) || websites?.[0] || null

  // Sync active website to localStorage when it changes
  useEffect(() => {
    if (activeWebsite?.websiteId) {
      setStoredWebsiteId(activeWebsite.websiteId)
    }
  }, [activeWebsite?.websiteId])

  // Switch to a different website
  const switchWebsite = useCallback((websiteId: string) => {
    setLocalActiveId(websiteId)
    setStoredWebsiteId(websiteId)
  }, [])

  // Refresh the website list
  const refreshWebsites = useCallback(() => {
    mutate()
  }, [mutate])

  // If the stored website is no longer accessible, clear it
  useEffect(() => {
    if (websites && localActiveId && !websites.find(w => w.websiteId === localActiveId)) {
      clearStoredWebsiteId()
      setLocalActiveId(null)
    }
  }, [websites, localActiveId])

  return {
    activeWebsite,
    websites: websites || [],
    isLoading: !websites && !error,
    error: error?.message || null,
    switchWebsite,
    isAdmin: activeWebsite ? ['OWNER', 'ADMIN'].includes(activeWebsite.role) : false,
    isOwner: activeWebsite ? activeWebsite.role === 'OWNER' : false,
    refreshWebsites,
  }
}

// ─── Server-side helper ─────────────────────────────────────────────

/**
 * Get the active website ID from the session (for server components)
 * Falls back to the user's first accessible website
 */
export function getActiveWebsiteIdFromSession(session: { user?: { activeWebsiteId?: string | null } }): string | null {
  return session?.user?.activeWebsiteId || null
}