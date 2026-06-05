'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function AnalyticsPage() {
  const { activeWebsite } = useActiveWebsite()
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')

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
    websiteId ? `/api/analytics/team-performance?websiteId=${websiteId}` : null,
    fetcher
  )

  const periodLabels: Record<string, string> = { '7d': 'Son 7 Gün', '30d': 'Son 30 Gün', '90d': 'Son 90 Gün' }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analitik</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {activeWebsite ? `${activeWebsite.name} — ` : ''}Performans metrikleri
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                period === p
                  ? 'bg-[#6C3CE1] text-white shadow-md shadow-[#6C3CE1]/30'
                  : 'bg-[#EDE9FE] dark:bg-gray-700 text-[#4A2080] dark:text-gray-300 hover:bg-[#DDD6FE] dark:hover:bg-gray-600'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Toplam Sohbet"
          value={convLoading ? '-' : String(convData?.totalConversations ?? 0)}
          color="purple"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Conversations Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E0F0] dark:border-gray-700 p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Günlük Sohbet Trafiği</h2>
          {convLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-[#6C3CE1] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : convData?.dailyConversations?.length > 0 ? (
            <div className="space-y-2">
              {convData.dailyConversations.slice(-7).map((day: { date: string; count: number }) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-20 shrink-0">
                    {new Date(day.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex-1 bg-[#F5F3FF] dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#6C3CE1] to-[#8B5CF6] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (day.count / Math.max(...convData.dailyConversations.slice(-7).map((d: { count: number }) => d.count), 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">{day.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-sm">Henüz veri yok</p>
            </div>
          )}
        </div>

        {/* Top Pages */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E0F0] dark:border-gray-700 p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">En Çok Ziyaret Edilen Sayfalar</h2>
          {visitorLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-[#6C3CE1] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visitorData?.topPages?.length > 0 ? (
            <div className="space-y-3">
              {visitorData.topPages.map((page: { url: string; views: number }, i: number) => (
                <div key={page.url} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#6C3CE1] w-6">{i + 1}.</span>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{page.url}</span>
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{page.views}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-sm">Henüz veri yok</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E0F0] dark:border-gray-700 p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Takım Performansı</h2>
        {teamLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-[#6C3CE1] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : teamData?.agents?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E0F0] dark:border-gray-700">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Temsilci</th>
                  <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Rol</th>
                  <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Atanan</th>
                  <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Çözülen</th>
                  <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Mesajlar</th>
                  <th className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pb-3">Çözülme %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0F0] dark:divide-gray-700">
                {teamData.agents.map((agent: {
                  userId: string; name: string; email: string; role: string;
                  assignedConversations: number; resolvedConversations: number;
                  totalMessages: number; resolutionRate: number
                }) => (
                  <tr key={agent.userId}>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C3CE1]/20 to-[#8B5CF6]/20 flex items-center justify-center text-xs font-bold text-[#6C3CE1] dark:text-[#A78BFA]">
                          {agent.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</p>
                          <p className="text-xs text-gray-400">{agent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        agent.role === 'OWNER' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        agent.role === 'ADMIN' ? 'bg-[#6C3CE1]/10 text-[#4A2080] dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-[#EDE9FE] text-[#4A2080] dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {agent.role === 'OWNER' ? 'Sahip' : agent.role === 'ADMIN' ? 'Yönetici' : 'Temsilci'}
                      </span>
                    </td>
                    <td className="text-center text-sm text-gray-700 dark:text-gray-300 py-3">{agent.assignedConversations}</td>
                    <td className="text-center text-sm text-gray-700 dark:text-gray-300 py-3">{agent.resolvedConversations}</td>
                    <td className="text-center text-sm text-gray-700 dark:text-gray-300 py-3">{agent.totalMessages}</td>
                    <td className="text-center py-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        agent.resolutionRate >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        agent.resolutionRate >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
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
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <p className="text-sm">Henüz takım üyesi yok</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, color, icon }: {
  title: string; value: string; color: 'purple' | 'blue' | 'green' | 'orange'; icon: React.ReactNode
}) {
  const gradients = {
    purple: 'from-[#6C3CE1] to-[#8B5CF6]',
    blue: 'from-[#3B82F6] to-[#6366F1]',
    green: 'from-emerald-500 to-emerald-600',
    orange: 'from-orange-500 to-amber-500',
  }
  const shadows = {
    purple: 'shadow-[#6C3CE1]/25',
    blue: 'shadow-blue-500/25',
    green: 'shadow-emerald-500/25',
    orange: 'shadow-orange-500/25',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E5E0F0] dark:border-gray-700 p-5 hover:shadow-lg hover:shadow-gray-200/50 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-11 h-11 bg-gradient-to-br ${gradients[color]} rounded-xl flex items-center justify-center shadow-md ${shadows[color]} text-white`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}