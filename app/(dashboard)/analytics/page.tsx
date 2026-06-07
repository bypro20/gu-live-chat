'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Download } from 'lucide-react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { usePlanFeature } from '@/lib/hooks/use-plan-feature'
import { useToast } from '@/lib/toast'

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function AnalyticsPage() {
  const { allowed: hasAdvancedAnalytics } = usePlanFeature('advancedAnalytics')
  const { activeWebsite } = useActiveWebsite()
  const { toast } = useToast()
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')
  const [exporting, setExporting] = useState(false)

  async function handleExport(type: 'conversations' | 'visitors' | 'team') {
    if (!activeWebsite?.websiteId) return
    setExporting(true)
    try {
      const res = await fetch(
        `/api/analytics/export?websiteId=${activeWebsite.websiteId}&period=${period}&type=${type}`
      )
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gu-chat-${type}-${period}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'CSV indirildi', variant: 'success' })
    } catch {
      toast({ title: 'Dışa aktarma başarısız', variant: 'error' })
    } finally {
      setExporting(false)
    }
  }

  const websiteId = activeWebsite?.websiteId || ''

  const { data: convData, isLoading: convLoading } = useSWR(
    websiteId ? `/api/analytics/conversations?websiteId=${websiteId}&period=${period}` : null,
    fetcher
  )

  const { data: visitorData, isLoading: visitorLoading } = useSWR(
    websiteId ? `/api/analytics/visitors?websiteId=${websiteId}&period=${period}` : null,
    fetcher
  )

  const { data: teamData, isLoading: teamLoading } = useSWR(
    websiteId && hasAdvancedAnalytics
      ? `/api/analytics/team-performance?websiteId=${websiteId}`
      : null,
    fetcher
  )

  const periodLabels: Record<string, string> = { '7d': 'Son 7 Gün', '30d': 'Son 30 Gün', '90d': 'Son 90 Gün' }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analitik</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {activeWebsite ? `${activeWebsite.name} · ` : ''}Performans metrikleri
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative group">
            <button
              disabled={!websiteId || exporting || !hasAdvancedAnalytics}
              title={!hasAdvancedAnalytics ? 'CSV dışa aktarma Profesyonel pakette' : undefined}
              className="flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block group-focus-within:block z-10 min-w-[160px] surface p-1 shadow-lg">
              {(['conversations', 'visitors', 'team'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleExport(t)}
                  disabled={exporting}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition"
                >
                  {t === 'conversations' ? 'Sohbetler' : t === 'visitors' ? 'Ziyaretçiler' : 'Ekip'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 sm:px-4 h-8 text-xs sm:text-sm font-medium rounded-md transition whitespace-nowrap ${
                  period === p
                    ? 'bg-primary text-primary-foreground shadow-brand'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
        <StatCard
          title="Toplam Sohbet"
          value={convLoading ? '-' : String(convData?.totalConversations ?? 0)}
          color="primary"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />
        <StatCard
          title="Açık Sohbetler"
          value={convLoading ? '-' : String(convData?.openConversations ?? 0)}
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Çözülme Oranı"
          value={convLoading ? '-' : `${convData?.resolutionRate ?? 0}%`}
          color="green"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Ziyaretçiler"
          value={visitorLoading ? '-' : String(visitorData?.totalVisitors ?? 0)}
          color="orange"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Daily Conversations Chart */}
        <div className="surface p-5 sm:p-6">
          <h2 className="text-base font-bold mb-4">Günlük Sohbet Trafiği</h2>
          {convLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : convData?.dailyConversations?.length > 0 ? (
            <div className="space-y-2">
              {convData.dailyConversations.slice(-7).map((day: { date: string; count: number }) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16 sm:w-20 shrink-0 tabular-nums">
                    {new Date(day.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (day.count / Math.max(...convData.dailyConversations.slice(-7).map((d: { count: number }) => d.count), 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground w-8 text-right tabular-nums">{day.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <p className="text-sm">Henüz veri yok</p>
            </div>
          )}
        </div>

        {/* Top Pages */}
        <div className="surface p-5 sm:p-6">
          <h2 className="text-base font-bold mb-4">En Çok Ziyaret Edilen Sayfalar</h2>
          {visitorLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visitorData?.topPages?.length > 0 ? (
            <div className="space-y-3">
              {visitorData.topPages.map((page: { url: string; views: number }, i: number) => (
                <div key={page.url} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary w-6 tabular-nums">{i + 1}.</span>
                  <span className="flex-1 text-sm text-foreground truncate">{page.url}</span>
                  <span className="text-sm font-semibold text-muted-foreground tabular-nums">{page.views}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <p className="text-sm">Henüz veri yok</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Performance */}
      <div className="surface p-5 sm:p-6">
        <h2 className="text-base font-bold mb-4">Takım Performansı</h2>
        {teamLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : teamData?.agents?.length > 0 ? (
          <div className="-mx-5 sm:mx-0 px-5 sm:px-0 overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase pb-3">Temsilci</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase pb-3">Rol</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase pb-3">Atanan</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase pb-3">Çözülen</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase pb-3">Mesajlar</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase pb-3">Çözülme %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {teamData.agents.map((agent: {
                  userId: string; name: string; email: string; role: string;
                  assignedConversations: number; resolvedConversations: number;
                  totalMessages: number; resolutionRate: number
                }) => (
                  <tr key={agent.userId}>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {agent.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{agent.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        agent.role === 'OWNER' || agent.role === 'ADMIN'
                          ? 'bg-primary-light text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {agent.role === 'OWNER' ? 'Sahip' : agent.role === 'ADMIN' ? 'Yönetici' : 'Temsilci'}
                      </span>
                    </td>
                    <td className="text-center text-sm text-foreground py-3 tabular-nums">{agent.assignedConversations}</td>
                    <td className="text-center text-sm text-foreground py-3 tabular-nums">{agent.resolvedConversations}</td>
                    <td className="text-center text-sm text-foreground py-3 tabular-nums">{agent.totalMessages}</td>
                    <td className="text-center py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-bold rounded-full tabular-nums ${
                        agent.resolutionRate >= 80 ? 'bg-success-light text-success' :
                        agent.resolutionRate >= 50 ? 'bg-warning-light text-warning' :
                        'bg-destructive-light text-destructive'
                      }`}>
                        {agent.resolutionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">Henüz takım üyesi yok</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, color, icon }: {
  title: string; value: string; color: 'primary' | 'blue' | 'green' | 'orange'; icon: React.ReactNode
}) {
  const tones = {
    primary: 'bg-primary-light text-primary',
    blue: 'bg-info-light text-info',
    green: 'bg-success-light text-success',
    orange: 'bg-warning-light text-warning',
  }

  return (
    <div className="surface p-5 hover:shadow-md transition-shadow h-full">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[color]}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-muted-foreground flex-1">{title}</span>
      </div>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
    </div>
  )
}