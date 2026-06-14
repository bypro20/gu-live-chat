'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, Globe, MessageSquare, Activity, Zap, AlertCircle,
  TrendingUp, Code2, Eye, ArrowRight, Radio,
} from 'lucide-react'
import { useToast } from '@/lib/toast'

type Summary = {
  totalUsers: number
  activeUsersMonth: number
  newUsersWeek: number
  totalWebsites: number
  newSitesWeek: number
  paidSites: number
  trialSites: number
  totalConversations: number
  conversationsToday: number
  totalMessages: number
  totalVisitors: number
  liveSessions: number
  widgetActive: number
  widgetInstalled: number
  widgetNever: number
  inactiveSiteCount: number
}

type ActiveSite = {
  id: string
  name: string
  domain: string
  websiteId: string
  ownerEmail: string
  plan: string
  widgetStatus: string
  lastActiveAt: string | null
  conversations: number
  visitors: number
}

type Intel = {
  summary: Summary
  planDistribution: { plan: string; count: number }[]
  signupSources: { source: string; count: number }[]
  recentUsers: Array<{
    id: string
    email: string
    name: string | null
    createdAt: string
    lastSeenAt: string | null
    _count: { ownedWebsites: number; memberships: number }
  }>
  inactiveSites: Array<{ id: string; name: string; domain: string; ownerEmail: string; websiteId: string }>
  topActiveSites: ActiveSite[]
}

const widgetBadge: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  INSTALLED: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
  INACTIVE: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  NEVER: 'bg-white/5 text-gray-500 border-white/10',
}

const widgetLabel: Record<string, string> = {
  ACTIVE: 'Aktif',
  INSTALLED: 'Kurulu',
  INACTIVE: 'Pasif',
  NEVER: 'Yok',
}

function Kpi({ label, value, sub, icon: Icon, accent }: {
  label: string
  value: string | number
  sub?: string
  icon: typeof Users
  accent?: string
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <div className={`p-2 rounded-xl ${accent || 'bg-violet-500/10 text-violet-400'}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminPlatformPage() {
  const { toast } = useToast()
  const [data, setData] = useState<Intel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/platform-intelligence')
      .then(async (res) => {
        if (!res.ok) throw new Error('Yüklenemedi')
        return res.json()
      })
      .then(setData)
      .catch(() => toast({ title: 'Platform verisi yüklenemedi', variant: 'error' }))
      .finally(() => setLoading(false))
  }, [toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] gap-3 text-gray-500">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        Platform analizi yükleniyor…
      </div>
    )
  }

  if (!data) return null

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Platform Merkezi</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kim kayıt oldu, hangi siteye widget eklendi, kim Gu Live Chat kullanıyor — A&apos;dan Z&apos;ye görünürlük
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
        <Kpi label="Kullanıcı" value={s.totalUsers} sub={`${s.activeUsersMonth} aktif (30g)`} icon={Users} />
        <Kpi label="Site" value={s.totalWebsites} sub={`+${s.newSitesWeek} bu hafta`} icon={Globe} accent="bg-blue-500/10 text-blue-400" />
        <Kpi label="Widget aktif" value={s.widgetActive} sub={`${s.widgetInstalled} kurulu toplam`} icon={Code2} accent="bg-emerald-500/10 text-emerald-400" />
        <Kpi label="Canlı oturum" value={s.liveSessions} sub="Son 5 dk" icon={Radio} accent="bg-rose-500/10 text-rose-400" />
        <Kpi label="Sohbet" value={s.totalConversations} sub={`+${s.conversationsToday} bugün`} icon={MessageSquare} accent="bg-cyan-500/10 text-cyan-400" />
        <Kpi label="Ücretli" value={s.paidSites} sub={`${s.trialSites} deneme`} icon={TrendingUp} accent="bg-amber-500/10 text-amber-400" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              En aktif siteler (Gu Live Chat kullananlar)
            </h2>
            <Link href="/admin/customer-sites" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              Kullanıcı & site detayı <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-5 py-3">Site / Domain</th>
                  <th className="px-3 py-3">Sahip</th>
                  <th className="px-3 py-3">Widget</th>
                  <th className="px-3 py-3">Son aktivite</th>
                  <th className="px-3 py-3">Sohbet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data.topActiveSites.map((site) => (
                  <tr key={site.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{site.name}</p>
                      <p className="text-xs text-gray-500">{site.domain}</p>
                      <p className="text-[10px] text-gray-600 font-mono mt-0.5">{site.websiteId}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-400 truncate max-w-[140px]">{site.ownerEmail}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-md border ${widgetBadge[site.widgetStatus] || widgetBadge.NEVER}`}>
                        {widgetLabel[site.widgetStatus] || site.widgetStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {site.lastActiveAt
                        ? new Date(site.lastActiveAt).toLocaleString('tr-TR')
                        : '—'}
                    </td>
                    <td className="px-3 py-3 text-gray-400 tabular-nums">{site.conversations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Widget durumu
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between"><span className="text-gray-400">Aktif (7 gün)</span><span className="text-emerald-400 font-semibold">{s.widgetActive}</span></li>
              <li className="flex justify-between"><span className="text-gray-400">Kurulu / kullanılmış</span><span className="text-sky-400 font-semibold">{s.widgetInstalled}</span></li>
              <li className="flex justify-between"><span className="text-gray-400">Hiç yüklenmemiş</span><span className="text-gray-500 font-semibold">{s.widgetNever}</span></li>
              <li className="flex justify-between border-t border-white/[0.06] pt-3"><span className="text-gray-400">Hareketsiz siteler</span><span className="text-amber-400 font-semibold">{s.inactiveSiteCount}</span></li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h2 className="font-semibold text-white mb-3">Plan dağılımı</h2>
            <ul className="space-y-2">
              {data.planDistribution.map((p) => (
                <li key={p.plan} className="flex justify-between text-sm">
                  <span className="text-gray-400">{p.plan}</span>
                  <span className="text-white font-medium">{p.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4" />
              Son kayıt olan kullanıcılar
            </h2>
            <Link href="/admin/users" className="text-xs text-violet-400">Tümü →</Link>
          </div>
          <ul className="space-y-3">
            {data.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="text-white truncate">{u.name || u.email}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</p>
                  <p className="text-[10px] text-gray-600">{u._count.ownedWebsites} site · {u._count.memberships} üyelik</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Widget henüz kurulmamış / hareketsiz siteler
          </h2>
          {data.inactiveSites.length === 0 ? (
            <p className="text-sm text-gray-500">Tüm sitelerde en az bir aktivite var.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {data.inactiveSites.map((site) => (
                <li key={site.id} className="text-sm flex justify-between gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                  <div className="min-w-0">
                    <p className="text-white truncate">{site.name}</p>
                    <p className="text-xs text-gray-500">{site.ownerEmail}</p>
                  </div>
                  <code className="text-[10px] text-gray-600 shrink-0">{site.websiteId.slice(0, 8)}…</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/conversations" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors">
          <MessageSquare className="w-4 h-4" />
          Tüm müşteri sohbetleri
        </Link>
        <Link href="/admin/visitors" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/[0.04] text-white text-sm font-medium transition-colors">
          <Eye className="w-4 h-4" />
          Canlı ekran izleme
        </Link>
        <Link href="/admin/websites" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/[0.04] text-white text-sm font-medium transition-colors">
          <Code2 className="w-4 h-4" />
          Embed kodları & siteler
        </Link>
      </div>
    </div>
  )
}
