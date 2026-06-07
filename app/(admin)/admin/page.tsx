'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Eye, Users, Globe, MessageSquare, Mail, CreditCard, Clock, Puzzle,
  TrendingUp, Activity, Shield, Database, Wifi, Settings,
  ChevronDown, Bell, RefreshCw, ArrowRight, UserCog, LayoutGrid,
  ExternalLink, BarChart3, DollarSign, Sparkles, Zap, CheckCircle2,
  Server, HardDrive, Circle, MoreHorizontal
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalWebsites: number
  totalConversations: number
  totalMessages: number
  activeVisitors: number
  totalRevenue: number
  paidWebsites: number
  trialWebsites: number
  bannedUsers: number
  totalIpBans: number
  planDistribution: { plan: string; count: number }[]
  recentUsers: Array<{ id: string; email: string; name: string | null; role: string; createdAt: string; _count: { websites: number } }>
  recentWebsites: Array<{ id: string; name: string; domain: string; plan: string; owner: { email: string } | null; createdAt: string }>
  addonPurchases: number
  addonRevenue: number
}

function useCounter(end: number, duration = 1500) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const counted = useRef(false)

  useEffect(() => {
    if (counted.current) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true
          const start = performance.now()
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.floor(eased * end))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [end, duration])

  return { value, ref }
}

const statCards = [
  { key: 'activeVisitors', label: 'Aktif Ziyaretçi', icon: Eye, color: 'emerald', href: '/admin/visitors', highlight: true },
  { key: 'totalUsers', label: 'Toplam Kullanıcı', icon: Users, color: 'blue', href: '/admin/users' },
  { key: 'totalWebsites', label: 'Kayıtlı Site', icon: Globe, color: 'sky', href: '/admin/websites' },
  { key: 'bannedUsers', label: 'Banlı Kullanıcı', icon: Shield, color: 'orange', href: '/admin/users' },
  { key: 'totalIpBans', label: 'IP Engeli', icon: Shield, color: 'amber', href: '/admin/ip-bans' },
  { key: 'totalConversations', label: 'Toplam Sohbet', icon: MessageSquare, color: 'orange', href: '/admin/inbox' },
  { key: 'totalMessages', label: 'Toplam Mesaj', icon: Mail, color: 'cyan' },
  { key: 'paidWebsites', label: 'Ücretli Site', icon: CreditCard, color: 'green' },
]

const colorMap: Record<string, { bg: string; text: string; ring: string; bar: string }> = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
    bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-200 dark:ring-blue-800',
    bar: 'bg-gradient-to-r from-blue-400 to-blue-500',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    text: 'text-sky-600 dark:text-sky-400',
    ring: 'ring-sky-200 dark:ring-sky-800',
    bar: 'bg-gradient-to-r from-sky-400 to-sky-500',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
    ring: 'ring-orange-200 dark:ring-orange-800',
    bar: 'bg-gradient-to-r from-orange-400 to-orange-500',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-600 dark:text-cyan-400',
    ring: 'ring-cyan-200 dark:ring-cyan-800',
    bar: 'bg-gradient-to-r from-cyan-400 to-cyan-500',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400',
    ring: 'ring-green-200 dark:ring-green-800',
    bar: 'bg-gradient-to-r from-green-400 to-green-500',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-200 dark:ring-amber-800',
    bar: 'bg-gradient-to-r from-amber-400 to-amber-500',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    text: 'text-teal-600 dark:text-teal-400',
    ring: 'ring-teal-200 dark:ring-teal-800',
    bar: 'bg-gradient-to-r from-teal-400 to-teal-500',
  },
}

const planColors: Record<string, { bg: string; text: string; bar: string }> = {
  FREE: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', bar: 'bg-gray-400 dark:bg-gray-500' },
  STARTER: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-gradient-to-r from-blue-400 to-blue-500' },
  PRO: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-600 dark:text-sky-400', bar: 'bg-gradient-to-r from-sky-400 to-sky-500' },
  BUSINESS: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500' },
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0, totalWebsites: 0, totalConversations: 0, totalMessages: 0,
    activeVisitors: 0, totalRevenue: 0, paidWebsites: 0, trialWebsites: 0,
    bannedUsers: 0, totalIpBans: 0,
    planDistribution: [], recentUsers: [], recentWebsites: [],
    addonPurchases: 0, addonRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [inboxUnread, setInboxUnread] = useState(0)
  const [health, setHealth] = useState({ ok: true, db: true, socket: false })
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {}
    try {
      const res = await fetch('/api/admin/visitors/live')
      if (res.ok) {
        const data = await res.json()
        setStats((prev) => ({ ...prev, activeVisitors: data.count || 0 }))
      }
    } catch {}
    try {
      const res = await fetch('/api/admin/inbox-unread')
      if (res.ok) {
        const data = await res.json()
        setInboxUnread(Number(data.unreadCount) || 0)
      }
    } catch {}
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
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [loadStats])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (loading) {
    return (
      <div className="p-6 lg:p-8 xl:p-10 max-w-[1440px] mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-7 w-48 bg-white/5 rounded-lg" />
              <div className="h-4 w-64 bg-white/5 rounded-md" />
            </div>
            <div className="h-9 w-32 bg-white/5 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[118px] bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-white/5 rounded" />
                    <div className="h-8 w-20 bg-white/5 rounded-lg" />
                  </div>
                  <div className="w-12 h-12 bg-white/5 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-white/[0.04] border border-white/[0.06] rounded-2xl" />
            <div className="h-72 bg-white/[0.04] border border-white/[0.06] rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-white/[0.04] border border-white/[0.06] rounded-2xl" />
            <div className="h-80 bg-white/[0.04] border border-white/[0.06] rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  const totalPlanCount = stats.planDistribution.reduce((a, b) => a + b.count, 0)

  return (
    <div className="p-6 lg:p-8 xl:p-10 max-w-[1440px] mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0 space-y-8">
          <header className="animate-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-1 text-[10px] font-bold bg-gradient-to-r from-[#1972F5] to-[#2563EB] text-white rounded-md tracking-[0.08em] shadow-lg shadow-[#1972F5]/30">
                    ADMIN
                  </span>
                  <span className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    Sistem Çevrimiçi
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Yönetim Paneli</h1>
                  <Sparkles className="w-5 h-5 text-amber-400/70" />
                </div>
                <p className="text-gray-500 mt-1 text-sm flex items-center gap-2">
                  Platform geneli istatistikler ve sistem yönetimi
                  <span className="hidden sm:inline text-gray-600">•</span>
                  <span className="hidden sm:inline text-gray-500 text-xs">
                    Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadStats}
                  className="p-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <Link
                  href="/admin/inbox"
                  className="p-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all duration-200 relative"
                  title="Gelen Kutusu"
                >
                  <Bell className="w-4 h-4" />
                  {inboxUnread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-0.5 flex items-center justify-center text-[9px] font-bold bg-primary text-white rounded-full border-2 border-[#0d0d1a]">
                      {inboxUnread > 99 ? '99+' : inboxUnread}
                    </span>
                  )}
                </Link>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/[0.08] transition-all duration-200 text-sm font-medium"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    Hızlı İşlemler
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[#14142A] shadow-2xl shadow-black/50 py-2 z-50 animate-in-scale origin-top-right">
                      <Link href="/admin/users" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                        <UserCog className="w-4 h-4 text-blue-400" />
                        Kullanıcıları Yönet
                      </Link>
                      <Link href="/admin/websites" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                        <LayoutGrid className="w-4 h-4 text-sky-400" />
                        Siteleri Yönet
                      </Link>
                      <Link href="/admin/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                        <Settings className="w-4 h-4 text-gray-400" />
                        Platform Ayarları
                      </Link>
                      <Link href="/admin/visitors" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        Canlı Ziyaretçiler
                      </Link>
                      <Link href="/admin/ip-bans" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                        <Shield className="w-4 h-4 text-amber-400" />
                        IP Engelleme
                      </Link>
                      <div className="border-t border-white/10 my-1" />
                      <button onClick={() => { setDropdownOpen(false); loadStats() }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors w-full text-left">
                        <RefreshCw className="w-4 h-4" />
                        Verileri Yenile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map((card, i) => {
              const value = stats[card.key as keyof AdminStats] as number
              const c = colorMap[card.color]
              return (
                <StatCard
                  key={card.key}
                  label={card.label}
                  value={value}
                  Icon={card.icon}
                  color={card.color}
                  href={card.href}
                  highlight={card.highlight}
                  delay={i}
                />
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 lg:p-7 animate-in-up" style={{ animationDelay: '320ms' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Plan Dağılımı
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Tüm kayıtlı sitelerin plan bazında dağılımı</p>
                </div>
                <span className="text-xs text-gray-500 bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06]">
                  Toplam {totalPlanCount} site
                </span>
              </div>
              {stats.planDistribution.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Henüz plan verisi bulunmuyor</div>
              ) : (
                <div className="space-y-4">
                  {stats.planDistribution.map((item, i) => {
                    const percent = totalPlanCount > 0 ? Math.round((item.count / totalPlanCount) * 100) : 0
                    const pc = planColors[item.plan] || planColors.FREE
                    return (
                      <div key={item.plan} className="animate-in-up" style={{ animationDelay: `${400 + i * 80}ms` }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${pc.bg} ${pc.text}`}>
                              {item.plan}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-white">{item.count}</span>
                            <span className="text-xs text-gray-500 w-10 text-right">{percent}%</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${pc.bar}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 lg:p-7 animate-in-up" style={{ animationDelay: '360ms' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Gelir Özeti
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Platform gelir durumu</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/[0.02] border border-emerald-500/20 rounded-xl p-5">
                  <p className="text-xs text-emerald-400/70 font-medium mb-1 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Abonelik Geliri
                  </p>
                  <p className="text-3xl font-bold text-white tracking-tight">
                    ₺{stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-sky-500/10 to-sky-500/[0.02] border border-sky-500/20 rounded-xl p-5">
                  <p className="text-xs text-sky-400/70 font-medium mb-1 flex items-center gap-1.5">
                    <Puzzle className="w-3.5 h-3.5" />
                    Eklenti Geliri
                  </p>
                  <p className="text-2xl font-bold text-white tracking-tight">
                    ₺{stats.addonRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stats.addonPurchases} adet eklenti satıldı</p>
                </div>
                <div className="border-t border-white/[0.06] pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Toplam Platform Geliri</p>
                    <p className="text-xl font-bold text-white tracking-tight">
                      ₺{(stats.totalRevenue + stats.addonRevenue).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden animate-in-up" style={{ animationDelay: '400ms' }}>
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    Son Kullanıcılar
                  </h2>
                </div>
                <Link href="/admin/users" className="group flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-medium transition-all duration-200">
                  Tümünü Gör
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {stats.recentUsers.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 text-sm">Henüz kullanıcı bulunmuyor</div>
                ) : (
                  stats.recentUsers.slice(0, 5).map((user, i) => (
                    <div key={user.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-all duration-150 group" style={{ animationDelay: `${400 + i * 60}ms` }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0 border border-white/10">
                          {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{user.name || 'İsimsiz'}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-gray-500">{user._count.websites} site</span>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          user.role === 'ADMIN'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                            : 'bg-white/[0.06] text-gray-400 border border-white/[0.06]'
                        }`}>
                          {user.role === 'ADMIN' ? 'Admin' : 'Kullanıcı'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden animate-in-up" style={{ animationDelay: '440ms' }}>
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-400" />
                    Son Siteler
                  </h2>
                </div>
                <Link href="/admin/websites" className="group flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover font-medium transition-all duration-200">
                  Tümünü Gör
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {stats.recentWebsites.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 text-sm">Henüz site bulunmuyor</div>
                ) : (
                  stats.recentWebsites.slice(0, 5).map((website, i) => (
                    <div key={website.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-all duration-150 group" style={{ animationDelay: `${440 + i * 60}ms` }}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">{website.name}</p>
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
                          <span>{website.domain}</span>
                          <span className="text-white/[0.06]">•</span>
                          <span>{website.owner?.email || 'Sahipsiz'}</span>
                        </p>
                      </div>
                      <PlanBadge plan={website.plan} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 animate-in-up" style={{ animationDelay: '480ms' }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-400 font-medium">Sistem Durumu</span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  İyi
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Wifi className={`w-3.5 h-3.5 ${health.ok ? 'text-emerald-400' : 'text-red-400'}`} />
                  API: <span className={health.ok ? 'text-emerald-400' : 'text-red-400'}>{health.ok ? 'Çalışıyor' : 'Sorunlu'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Database className={`w-3.5 h-3.5 ${health.db ? 'text-emerald-400' : 'text-red-400'}`} />
                  Veritabanı: <span className={health.db ? 'text-emerald-400' : 'text-red-400'}>{health.db ? 'Bağlı' : 'Kopuk'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Server className={`w-3.5 h-3.5 ${health.socket ? 'text-emerald-400' : 'text-amber-400'}`} />
                  Canlı: <span className={health.socket ? 'text-emerald-400' : 'text-amber-400'}>{health.socket ? 'Socket aktif' : 'Polling modu'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:w-64 shrink-0 space-y-4">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 animate-in-up" style={{ animationDelay: '500ms' }}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Hızlı Erişim
            </h3>
            <div className="space-y-2">
              <QuickActionButton href="/admin/inbox" icon={MessageSquare} label="Gelen Kutusu" color="orange" />
              <QuickActionButton href="/admin/users" icon={Users} label="Kullanıcıları Yönet" color="blue" />
              <QuickActionButton href="/admin/websites" icon={Globe} label="Siteleri Yönet" color="sky" />
              <QuickActionButton href="/admin/settings" icon={Settings} label="Platform Ayarları" color="gray" />
              <QuickActionButton href="/admin/visitors" icon={Activity} label="Canlı Ziyaretçiler" color="emerald" />
              <QuickActionButton href="/admin/ip-bans" icon={Shield} label="IP Engelleme" color="amber" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-primary/[0.02] border border-primary/20 rounded-2xl p-5 animate-in-up" style={{ animationDelay: '540ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">İstatistik</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Aktif Ziyaretçi</span>
                <span className="text-sm font-bold text-white">{stats.activeVisitors}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Toplam Kullanıcı</span>
                <span className="text-sm font-bold text-white">{stats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Toplam Site</span>
                <span className="text-sm font-bold text-white">{stats.totalWebsites}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Ücretli Site</span>
                <span className="text-sm font-bold text-white">{stats.paidWebsites}</span>
              </div>
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Gelir</span>
                  <span className="text-sm font-bold text-emerald-400">₺{(stats.totalRevenue + stats.addonRevenue).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function StatCard({ label, value, Icon, color, href, highlight, delay }: {
  label: string; value: number; Icon: React.ComponentType<{ className?: string }>; color: string; href?: string; highlight?: boolean; delay: number
}) {
  const { value: animatedValue, ref } = useCounter(value)
  const c = colorMap[color]

  const card = (
    <div
      ref={ref}
      className={[
        'relative overflow-hidden group bg-white/[0.03] border rounded-2xl p-5 transition-all duration-300',
        highlight
          ? 'border-emerald-500/30 ring-1 ring-emerald-500/20 hover:ring-emerald-500/40'
          : 'border-white/[0.06] hover:border-white/[0.12]',
        href ? 'cursor-pointer hover:translate-y-[-2px] hover:shadow-lg hover:shadow-black/20' : '',
        'animate-in-up',
      ].join(' ')}
      style={{ animationDelay: `${100 + delay * 40}ms` }}
    >
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-xs font-medium text-gray-500 tracking-wide">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1.5 tabular-nums tracking-tight">
            {animatedValue.toLocaleString()}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.bg} ${c.text} border border-white/[0.06]`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent pointer-events-none" />
      )}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent group-hover:via-white/[0.08] transition-all duration-500" />
    </div>
  )

  if (href) return <Link href={href}>{card}</Link>
  return card
}

function PlanBadge({ plan }: { plan: string }) {
  const pc = planColors[plan] || planColors.FREE
  return (
    <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-md ${pc.bg} ${pc.text} border border-white/[0.06]`}>
      {plan}
    </span>
  )
}

function QuickActionButton({ href, icon: Icon, label, color }: {
  href: string; icon: React.ComponentType<{ className?: string }>; label: string; color: string
}) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20',
    gray: 'text-gray-400 bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20',
  }
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 group ${colorClasses[color] || colorClasses.gray}`}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1">{label}</span>
      <ExternalLink className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
    </Link>
  )
}
