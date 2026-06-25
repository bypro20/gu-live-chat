'use client'

import { createContext, useContext } from 'react'

export type AdminShellLiveState = {
  inboxUnread: number
  mailUnread: number
  liveVisitorCount: number
  health: { ok: boolean; db: boolean; socket: boolean }
  lastHealthCheck: Date
}

const AdminShellContext = createContext<AdminShellLiveState | null>(null)

export function AdminShellProvider({
  value,
  children,
}: {
  value: AdminShellLiveState
  children: React.ReactNode
}) {
  return <AdminShellContext.Provider value={value}>{children}</AdminShellContext.Provider>
}

export function useAdminShellLive() {
  const ctx = useContext(AdminShellContext)
  if (!ctx) {
    throw new Error('useAdminShellLive must be used within AdminShellProvider')
  }
  return ctx
}

export function useAdminShellLiveOptional() {
  return useContext(AdminShellContext)
}
