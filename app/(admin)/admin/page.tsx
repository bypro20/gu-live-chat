'use client'

import { useEffect, useState } from 'react'

interface AdminStats {
  totalUsers: number
  totalWebsites: number
  totalConversations: number
  totalMessages: number
  activeVisitors: number
  recentUsers: Array<{ id: string; email: string; name: string | null; role: string; createdAt: string }>
  recentWebsites: Array<{ id: string; name: string; domain: string; plan: string; createdAt: string }>
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalWebsites: 0,
    totalConversations: 0,
    totalMessages: 0,
    activeVisitors: 0,
    recentUsers: [],
    recentWebsites: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err)
      }

      // Fetch active visitors count
      try {
        const res = await fetch('/api/admin/visitors/live')
        if (res.ok) {
          const data = await res.json()
          setStats((prev) => ({ ...prev, activeVisitors: data.count || 0 }))
        }
      } catch { /* ignore */ }

      setLoading(false)
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 text-xs font-bold bg-red-500 text-white rounded-full">ADMIN</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yönetim Paneli</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Tüm platform verilerini yönetin ve izleyin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <a href="/admin/visitors" className="block hover:scale-[1.02] transition-transform">
          <AdminStatCard title="Aktif Ziyaretçiler" value={stats.activeVisitors} icon="👁️" color="emerald" highlight />
        </a>
        <AdminStatCard title="Toplam Kullanıcı" value={stats.totalUsers} icon="👥" color="blue" />
        <AdminStatCard title="Toplam Site" value={stats.totalWebsites} icon="🌐" color="green" />
        <AdminStatCard title="Toplam Sohbet" value={stats.totalConversations} icon="💬" color="purple" />
        <AdminStatCard title="Toplam Mesaj" value={stats.totalMessages} icon="📨" color="orange" />
      </div>

      {/* Recent Users & Websites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Son Kullanıcılar</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {stats.recentUsers.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">Henüz kullanıcı yok</div>
            ) : (
              stats.recentUsers.map(user => (
                <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                      {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name || 'İsimsiz'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {user.role === 'ADMIN' ? 'Admin' : 'Kullanıcı'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Websites */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Son Siteler</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {stats.recentWebsites.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">Henüz site yok</div>
            ) : (
              stats.recentWebsites.map(website => (
                <div key={website.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{website.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{website.domain}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    website.plan === 'FREE' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                    website.plan === 'STARTER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    website.plan === 'PRO' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {website.plan}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminStatCard({ title, value, icon, color, highlight }: { title: string; value: number; icon: string; color: string; highlight?: boolean }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 ${highlight ? 'border-2 border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-100 dark:ring-emerald-900' : 'border border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}