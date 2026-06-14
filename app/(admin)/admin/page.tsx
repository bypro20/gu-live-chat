'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminCommandCenter, type CommandCenterStats } from '@/components/admin/admin-command-center'

const emptyTrialFunnel = {
  activeTrials: 0,
  conversionRate: 0,
  widgetBonusRate: 0,
  expiringWithin48h: 0,
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<CommandCenterStats>({
    totalUsers: 0,
    totalWebsites: 0,
    totalConversations: 0,
    totalMessages: 0,
    activeVisitors: 0,
    totalRevenue: 0,
    addonRevenue: 0,
    paidWebsites: 0,
    trialWebsites: 0,
    bannedUsers: 0,
    totalIpBans: 0,
    inboxUnread: 0,
    trialFunnel: emptyTrialFunnel,
    recentUsers: [],
    recentWebsites: [],
    planDistribution: [],
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [health, setHealth] = useState({ ok: true, db: true, socket: false })

  const loadStats = useCallback(async () => {
    let next: Partial<CommandCenterStats> = {}

    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        next = {
          totalUsers: data.totalUsers,
          totalWebsites: data.totalWebsites,
          totalConversations: data.totalConversations,
          totalMessages: data.totalMessages,
          totalRevenue: data.totalRevenue,
          addonRevenue: data.addonRevenue,
          paidWebsites: data.paidWebsites,
          trialWebsites: data.trialWebsites,
          bannedUsers: data.bannedUsers,
          totalIpBans: data.totalIpBans,
          recentUsers: data.recentUsers || [],
          recentWebsites: data.recentWebsites || [],
          planDistribution: data.planDistribution || [],
          trialFunnel: data.trialFunnel
            ? {
                activeTrials: data.trialFunnel.activeTrials,
                conversionRate: data.trialFunnel.conversionRate,
                widgetBonusRate: data.trialFunnel.widgetBonusRate,
                expiringWithin48h: data.trialFunnel.expiringWithin48h,
              }
            : emptyTrialFunnel,
        }
      }
    } catch {
      // ignore
    }

    try {
      const res = await fetch('/api/admin/visitors/live')
      if (res.ok) {
        const data = await res.json()
        next.activeVisitors = data.count || 0
      }
    } catch {
      // ignore
    }

    try {
      const res = await fetch('/api/admin/inbox-unread')
      if (res.ok) {
        const data = await res.json()
        next.inboxUnread = Number(data.unreadCount) || 0
      }
    } catch {
      // ignore
    }

    try {
      const res = await fetch('/api/health')
      if (res.ok) {
        const data = await res.json()
        setHealth({ ok: !!data.ok, db: !!data.db, socket: !!data.socket })
      } else {
        setHealth({ ok: false, db: false, socket: false })
      }
    } catch {
      setHealth({ ok: false, db: false, socket: false })
    }

    setStats((prev) => ({ ...prev, ...next }))
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [loadStats])

  if (loading) {
    return (
      <div className="admin-command-center max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-32 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return <AdminCommandCenter stats={stats} health={health} lastUpdated={lastUpdated} />
}
