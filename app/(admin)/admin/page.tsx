'use client'

import { useCallback, useEffect, useState } from 'react'
import { AdminCommandCenter, type CommandCenterStats } from '@/components/admin/admin-command-center'
import { useAdminShellLive } from '@/components/admin/admin-shell-context'

const emptyTrialFunnel = {
  activeTrials: 0,
  conversionRate: 0,
  widgetBonusRate: 0,
  expiringWithin48h: 0,
}

export default function AdminDashboardPage() {
  const { inboxUnread, mailUnread, health, lastHealthCheck } = useAdminShellLive()
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
    mailUnread: 0,
    trialFunnel: emptyTrialFunnel,
    recentUsers: [],
    recentWebsites: [],
    planDistribution: [],
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const loadStats = useCallback(async () => {
    try {
      const [statsRes, visitorsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/visitors/live'),
      ])

      let next: Partial<CommandCenterStats> = {}

      if (statsRes.ok) {
        const data = await statsRes.json()
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

      if (visitorsRes.ok) {
        const data = await visitorsRes.json()
        next.activeVisitors = data.count || 0
      }

      setStats((prev) => ({ ...prev, ...next }))
      setLastUpdated(new Date())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 60000)
    return () => clearInterval(interval)
  }, [loadStats])

  const mergedStats: CommandCenterStats = {
    ...stats,
    inboxUnread,
    mailUnread,
  }

  if (loading) {
    return (
      <div className="admin-command-center max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="admin-skeleton space-y-6">
          <div className="h-28 rounded-2xl admin-panel-card" />
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl admin-panel-card" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl admin-panel-card" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminCommandCenter
      stats={mergedStats}
      health={health}
      lastUpdated={lastUpdated.getTime() > lastHealthCheck.getTime() ? lastUpdated : lastHealthCheck}
    />
  )
}
