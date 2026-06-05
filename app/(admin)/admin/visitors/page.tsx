'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Globe, Monitor, Smartphone, Tablet, Globe2, Clock, Link as LinkIcon,
  Users, Search, X, ExternalLink, Activity, Eye,
  ChevronDown, ChevronUp, MessageSquare,
  Ban, RefreshCw, MousePointer2
} from 'lucide-react'
import { getDeviceLabel, getBrowserLabel, formatTimeAgo, formatDuration } from '@/lib/visitors-utils'
import type { LiveVisitor } from '@/lib/stores/live-visitors-store'

interface VisitorDetail extends LiveVisitor {
  visitorName?: string
  visitorEmail?: string
  visitorPhone?: string
  timezone?: string
  isp?: string
  region?: string
  latitude?: number
  longitude?: number
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  hasConversation?: boolean
  pages?: { title: string; url: string; viewedAt: string }[]
}

interface HistorySession {
  id: string
  visitorId: string
  startedAt: string
  endedAt: string | null
  lastActiveAt: string
  visitor: { name: string | null; email: string | null }
  pages: { title: string; url: string; viewedAt: string }[]
}

const browserColors: Record<string, string> = {
  chrome: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30',
  firefox: 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400 border-orange-500/30',
  safari: 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30',
  edge: 'bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/30',
  opera: 'bg-gradient-to-br from-red-500/20 to-red-600/10 text-red-400 border-red-500/30',
}

const countryMap: Record<string, { flag: string; x: number; y: number }> = {
  TR: { flag: '🇹🇷', x: 55, y: 40 },
  US: { flag: '🇺🇸', x: 20, y: 35 },
  GB: { flag: '🇬🇧', x: 48, y: 28 },
  DE: { flag: '🇩🇪', x: 52, y: 30 },
  FR: { flag: '🇫🇷', x: 50, y: 33 },
  NL: { flag: '🇳🇱', x: 50, y: 27 },
  RU: { flag: '🇷🇺', x: 60, y: 18 },
  CN: { flag: '🇨🇳', x: 78, y: 32 },
  JP: { flag: '🇯🇵', x: 87, y: 33 },
  BR: { flag: '🇧🇷', x: 32, y: 65 },
  IN: { flag: '🇮🇳', x: 70, y: 42 },
  CA: { flag: '🇨🇦', x: 18, y: 25 },
  AU: { flag: '🇦🇺', x: 87, y: 67 },
  IT: { flag: '🇮🇹', x: 52, y: 36 },
  ES: { flag: '🇪🇸', x: 46, y: 37 },
  SE: { flag: '🇸🇪', x: 53, y: 20 },
  NO: { flag: '🇳🇴', x: 50, y: 17 },
  FI: { flag: '🇫🇮', x: 58, y: 17 },
  PL: { flag: '🇵🇱', x: 55, y: 26 },
  UA: { flag: '🇺🇦', x: 57, y: 29 },
  GR: { flag: '🇬🇷', x: 56, y: 40 },
  EG: { flag: '🇪🇬', x: 57, y: 50 },
  ZA: { flag: '🇿🇦', x: 55, y: 72 },
  NG: { flag: '🇳🇬', x: 49, y: 55 },
  KE: { flag: '🇰🇪', x: 56, y: 60 },
  AR: { flag: '🇦🇷', x: 27, y: 70 },
  MX: { flag: '🇲🇽', x: 14, y: 45 },
  KR: { flag: '🇰🇷', x: 84, y: 35 },
  ID: { flag: '🇮🇩', x: 80, y: 55 },
  TH: { flag: '🇹🇭', x: 77, y: 47 },
  VN: { flag: '🇻🇳', x: 79, y: 44 },
  SA: { flag: '🇸🇦', x: 62, y: 44 },
  AE: { flag: '🇦🇪', x: 63, y: 46 },
  IL: { flag: '🇮🇱', x: 58, y: 37 },
  PK: { flag: '🇵🇰', x: 68, y: 38 },
  BD: { flag: '🇧🇩', x: 73, y: 44 },
  PH: { flag: '🇵🇭', x: 83, y: 48 },
  MY: { flag: '🇲🇾', x: 78, y: 52 },
  SG: { flag: '🇸🇬', x: 77, y: 56 },
  HK: { flag: '🇭🇰', x: 81, y: 42 },
  TW: { flag: '🇹🇼', x: 83, y: 44 },
  CZ: { flag: '🇨🇿', x: 53, y: 30 },
  AT: { flag: '🇦🇹', x: 52, y: 32 },
  CH: { flag: '🇨🇭', x: 49, y: 33 },
  PT: { flag: '🇵🇹', x: 44, y: 39 },
  BE: { flag: '🇧🇪', x: 49, y: 28 },
  DK: { flag: '🇩🇰', x: 51, y: 22 },
  HU: { flag: '🇭🇺', x: 54, y: 33 },
  RO: { flag: '🇷🇴', x: 57, y: 34 },
  BG: { flag: '🇧🇬', x: 57, y: 37 },
  RS: { flag: '🇷🇸', x: 55, y: 36 },
  IE: { flag: '🇮🇪', x: 44, y: 26 },
  CL: { flag: '🇨🇱', x: 28, y: 72 },
  CO: { flag: '🇨🇴', x: 22, y: 55 },
  PE: { flag: '🇵🇪', x: 24, y: 60 },
  NZ: { flag: '🇳🇿', x: 90, y: 70 },
}

function DeviceIcon({ device }: { device?: string | null }) {
  const d = (device || '').toLowerCase()
  if (d.includes('mobile') || d.includes('iphone') || d.includes('android')) return <Smartphone className="w-4 h-4" />
  if (d.includes('tablet') || d.includes('ipad')) return <Tablet className="w-4 h-4" />
  return <Monitor className="w-4 h-4" />
}

function maskIP(ip?: string | null): string {
  if (!ip) return '—'
  const parts = ip.split('.')
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.xxx.xxx`
  return ip.slice(0, 8) + '...'
}

function getFlag(country?: string | null): string {
  if (!country) return '🌍'
  const c = country.toUpperCase()
  return countryMap[c]?.flag || getFlagFromCode(c)
}

function getFlagFromCode(code: string): string {
  if (code.length !== 2) return '🌍'
  const offset = 0x1F1E6 - 65
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset)
}

function getTimeSince(date?: string | null): string {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Az önce'
  if (min < 60) return `${min} dk önce`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} sa önce`
  return `${Math.floor(hr / 24)} gün önce`
}

function getCountryCounts(visitors: LiveVisitor[]): Record<string, { count: number; visitors: LiveVisitor[] }> {
  const map: Record<string, { count: number; visitors: LiveVisitor[] }> = {}
  for (const v of visitors) {
    const key = v.country || 'Bilinmiyor'
    if (!map[key]) map[key] = { count: 0, visitors: [] }
    map[key].count++
    map[key].visitors.push(v)
  }
  return map
}

export default function AdminVisitorsPage() {
  const [visitors, setVisitors] = useState<LiveVisitor[]>([])
  const [historySessions, setHistorySessions] = useState<HistorySession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVisitor, setSelectedVisitor] = useState<LiveVisitor | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState('24h')
  const [mapHover, setMapHover] = useState<string | null>(null)
  const [detailedData, setDetailedData] = useState<Record<string, VisitorDetail>>({})

  const fetchData = useCallback(async () => {
    try {
      const [liveRes, historyRes] = await Promise.all([
        fetch('/api/admin/visitors/live'),
        fetch('/api/visitors/history?page=1&limit=50'),
      ])
      if (liveRes.ok) {
        const data = await liveRes.json()
        setVisitors(data.visitors || [])
      }
      if (historyRes.ok) {
        const data = await historyRes.json()
        setHistorySessions(data.sessions || [])
      }
    } catch (e) {
      console.error('[AdminVisitors] fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  const filteredVisitors = visitors.filter(v => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (v.name || '').toLowerCase().includes(q) ||
      (v.email || '').toLowerCase().includes(q) ||
      (v.country || '').toLowerCase().includes(q) ||
      (v.city || '').toLowerCase().includes(q) ||
      v.currentPage.toLowerCase().includes(q) ||
      (v.browser || '').toLowerCase().includes(q) ||
      (v.os || '').toLowerCase().includes(q)
    )
  })

  const sortedVisitors = [...filteredVisitors].sort((a, b) => {
    const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0
    const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0
    return bTime - aTime
  })

  const activeCount = sortedVisitors.filter(v => {
    if (!v.lastActiveAt) return false
    return Date.now() - new Date(v.lastActiveAt).getTime() < 300000
  }).length

  const todayStr = new Date().toDateString()
  const todayVisitors = visitors.filter(v => {
    if (!v.lastActiveAt) return false
    return new Date(v.lastActiveAt).toDateString() === todayStr
  })
  const uniqueTodayIds = new Set(todayVisitors.map(v => v.visitorId))

  const totalSessions = historySessions.length
  const avgDurationMs = historySessions
    .filter(s => s.endedAt)
    .reduce((acc, s) => acc + (new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime()), 0)
  const avgSessions = historySessions.filter(s => s.endedAt).length
  const avgDurationStr = avgSessions > 0
    ? formatDuration(new Date(0).toISOString(), new Date(avgDurationMs / avgSessions).toISOString())
    : '—'

  const countryData = getCountryCounts(sortedVisitors)
  const maxCountryCount = Math.max(...Object.values(countryData).map(c => c.count), 1)

  const deviceTypes: Record<string, number> = { Masaüstü: 0, Mobil: 0, Tablet: 0 }
  for (const v of sortedVisitors) {
    const label = getDeviceLabel(v.device)
    deviceTypes[label] = (deviceTypes[label] || 0) + 1
  }
  const deviceTotal = Object.values(deviceTypes).reduce((a, b) => a + b, 0) || 1

  const browsers: Record<string, number> = {}
  for (const v of sortedVisitors) {
    const label = getBrowserLabel(v.browser)
    browsers[label] = (browsers[label] || 0) + 1
  }
  const browserTotal = Object.values(browsers).reduce((a, b) => a + b, 0) || 1

  const handleVisitorClick = async (v: LiveVisitor) => {
    if (selectedVisitor?.visitorId === v.visitorId) {
      setSelectedVisitor(null)
      return
    }
    setSelectedVisitor(v)
    if (!detailedData[v.visitorId]) {
      try {
        const res = await fetch(`/api/visitors/history?visitorId=${v.visitorId}&page=1&limit=5`)
        if (res.ok) {
          const data = await res.json()
          const session = data.sessions?.[0]
          if (session) {
            setDetailedData(prev => ({
              ...prev,
              [v.visitorId]: {
                ...v,
                visitorName: session.visitor?.name,
                visitorEmail: session.visitor?.email,
                pages: session.pages || [],
              } as any,
            }))
          }
        }
      } catch {}
    }
  }

  const handleBan = (ip?: string | null) => {
    if (!ip || !confirm(`${ip} adresini engellemek istediğinize emin misiniz?`)) return
    fetch('/api/admin/ip-bans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ipAddress: ip }),
    }).then(() => alert('IP adresi engellendi'))
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8 max-w-[1440px] mx-auto min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-2.5 py-1 text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-md tracking-[0.08em] shadow-lg shadow-emerald-500/25">
              CANLI
            </span>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Canlı Ziyaretçiler</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">Tüm sitelerdeki ziyaretçileri gerçek zamanlı takip edin</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-sm font-semibold text-emerald-400 tabular-nums">{activeCount} aktif</span>
          </span>
          <div className="flex rounded-xl border border-white/10 overflow-hidden">
            {['1s', '24h', '7d'].map(t => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-3.5 py-2 text-xs font-medium transition-all ${
                  timeFilter === t
                    ? 'bg-white/10 text-white'
                    : 'bg-white/[0.03] text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {t === '1s' ? 'Şu An' : t === '24h' ? 'Son 24 Saat' : '7 Gün'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/[0.07] to-emerald-500/[0.02] border border-emerald-500/20 rounded-2xl p-4 lg:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-400/80 tracking-wide">Anlık Aktif Ziyaretçi</p>
              <p className="text-2xl lg:text-3xl font-bold text-white mt-1 tabular-nums tracking-tight">{activeCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400/40 to-transparent" />
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/[0.07] to-blue-500/[0.02] border border-blue-500/20 rounded-2xl p-4 lg:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-blue-400/80 tracking-wide">Bugünkü Ziyaretçi</p>
              <p className="text-2xl lg:text-3xl font-bold text-white mt-1 tabular-nums tracking-tight">{uniqueTodayIds.size}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400/40 to-transparent" />
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-violet-500/[0.07] to-violet-500/[0.02] border border-violet-500/20 rounded-2xl p-4 lg:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-violet-400/80 tracking-wide">Toplam Oturum</p>
              <p className="text-2xl lg:text-3xl font-bold text-white mt-1 tabular-nums tracking-tight">{totalSessions}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400 border border-violet-500/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400/40 to-transparent" />
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/[0.07] to-orange-500/[0.02] border border-orange-500/20 rounded-2xl p-4 lg:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-orange-400/80 tracking-wide">Ort. Süre</p>
              <p className="text-2xl lg:text-3xl font-bold text-white mt-1 tabular-nums tracking-tight">{avgDurationStr}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-400 border border-orange-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400/40 to-transparent" />
        </div>
      </div>

      {/* WORLD MAP + DEVICE/BROWSER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 lg:p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-primary" />
                Dünya Haritası
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">{Object.keys(countryData).length} ülkeden ziyaretçi</p>
            </div>
            <span className="text-xs text-gray-500 bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06]">
              {sortedVisitors.length} ziyaretçi
            </span>
          </div>

          <div className="relative w-full aspect-[2/1] bg-gradient-to-b from-blue-500/[0.03] via-transparent to-emerald-500/[0.03] rounded-xl border border-white/[0.04] overflow-hidden">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }} />

            {Object.entries(countryMap).map(([code, pos]) => {
              const data = countryData[code]
              if (!data) return null
              const size = Math.max(8, Math.round(8 + (data.count / maxCountryCount) * 24))
              const intensity = data.count / maxCountryCount
              const r = Math.round(34 + intensity * 221)
              const g = Math.round(197 - intensity * 160)
              const b = Math.round(94 - intensity * 80)
              return (
                <div
                  key={code}
                  className="absolute flex items-center justify-center transition-all duration-300 cursor-pointer group"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                  onMouseEnter={() => setMapHover(code)}
                  onMouseLeave={() => setMapHover(null)}
                >
                  <div
                    className="rounded-full transition-all duration-300 shadow-lg"
                    style={{
                      width: size,
                      height: size,
                      background: `radial-gradient(circle at 35% 35%, rgba(${r},${g},${b},0.9), rgba(${Math.round(r*0.5)},${Math.round(g*0.5)},${Math.round(b*0.5)},0.6))`,
                      boxShadow: `0 0 ${size}px rgba(${r},${g},${b},0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
                    }}
                  />
                  {(mapHover === code || data.count > 1) && (
                    <div className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-gray-900/95 border border-white/10 whitespace-nowrap text-xs font-medium text-white shadow-xl backdrop-blur-sm transition-all duration-200 ${
                      mapHover === code ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
                    }`}>
                      {pos.flag} {code} · {data.count}
                    </div>
                  )}
                </div>
              )
            })}

            {Object.keys(countryData).length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
                <div className="text-center">
                  <Globe2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Henüz konum verisi yok</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {Object.entries(countryData).sort((a, b) => b[1].count - a[1].count).slice(0, 8).map(([country, data]) => (
              <span
                key={country}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-gray-300"
              >
                {getFlag(country)} {country === 'Bilinmiyor' ? country : country} <span className="text-gray-500 font-medium">{data.count}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* DEVICE BREAKDOWN */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Monitor className="w-4 h-4 text-primary" />
              Cihaz Dağılımı
            </h3>
            <div className="space-y-3">
              {Object.entries(deviceTypes).map(([type, count]) => {
                const percent = Math.round((count / deviceTotal) * 100)
                const colors: Record<string, { bar: string; text: string; icon: any }> = {
                  Masaüstü: { bar: 'bg-gradient-to-r from-blue-500 to-blue-400', text: 'text-blue-400', icon: Monitor },
                  Mobil: { bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400', text: 'text-emerald-400', icon: Smartphone },
                  Tablet: { bar: 'bg-gradient-to-r from-violet-500 to-violet-400', text: 'text-violet-400', icon: Tablet },
                }
                const c = colors[type] || { bar: 'bg-gradient-to-r from-gray-500 to-gray-400', text: 'text-gray-400', icon: Monitor }
                const Icon = c.icon
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${c.text}`} />
                        <span className="text-xs text-gray-300">{type}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium tabular-nums">{percent}%</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${c.bar}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* BROWSER BREAKDOWN */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-primary" />
              Tarayıcı Dağılımı
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(browsers).sort((a, b) => b[1] - a[1]).map(([browser, count]) => {
                const b = browser.toLowerCase()
                const colorClass = browserColors[b] || 'bg-gradient-to-br from-gray-500/20 to-gray-600/10 text-gray-400 border-gray-500/30'
                const percent = Math.round((count / browserTotal) * 100)
                return (
                  <span
                    key={browser}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${colorClass}`}
                  >
                    {browser}
                    <span className="opacity-60">{percent}%</span>
                  </span>
                )
              })}
              {Object.keys(browsers).length === 0 && (
                <span className="text-xs text-gray-500">Henüz veri yok</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VISITOR LIST */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="p-4 lg:p-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Ziyaretçi Listesi
            </h2>
            <span className="text-xs text-gray-500 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06] tabular-nums">
              {sortedVisitors.length}
            </span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="İsim, ülke, sayfa ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {loading && sortedVisitors.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Ziyaretçiler yükleniyor...</span>
            </div>
          </div>
        ) : sortedVisitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
              <Eye className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-lg font-semibold text-gray-400">Henüz ziyaretçi yok</p>
            <p className="text-sm text-gray-600 mt-1 max-w-sm">
              Ziyaretçiler sitenizi görüntülemeye başladığında burada görünecekler
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {sortedVisitors.map((visitor) => {
              const isOnline = visitor.lastActiveAt
                ? Date.now() - new Date(visitor.lastActiveAt).getTime() < 300000
                : false
              const isExpanded = selectedVisitor?.visitorId === visitor.visitorId
              const detail = detailedData[visitor.visitorId]
              return (
                <div key={visitor.visitorId}>
                  <button
                    onClick={() => handleVisitorClick(visitor)}
                    className={`w-full text-left p-4 hover:bg-white/[0.02] transition-all duration-200 ${
                      isExpanded ? 'bg-white/[0.03]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 lg:gap-4">
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                          isOnline
                            ? 'from-emerald-500 to-teal-600 shadow-emerald-500/25'
                            : 'from-gray-500 to-gray-600 shadow-gray-500/25'
                        }`}>
                          {(visitor.name || 'A')[0].toUpperCase()}
                        </div>
                        {isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0d0d1a] rounded-full">
                            <div className="w-full h-full bg-emerald-500 rounded-full animate-ping opacity-75" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {visitor.name || 'Anonim'}
                            </p>
                            {visitor.email && (
                              <span className="text-[10px] text-gray-500 truncate hidden sm:inline">({visitor.email})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isOnline && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                            )}
                            <span className="text-[10px] text-gray-500 tabular-nums">
                              {getTimeSince(visitor.lastActiveAt)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <DeviceIcon device={visitor.device} />
                          <span className="text-[10px] text-gray-400">{getDeviceLabel(visitor.device)}</span>
                          <span className="text-gray-600">·</span>
                          <span className="text-[10px] text-gray-400">{getBrowserLabel(visitor.browser)}</span>
                          {visitor.country && (
                            <>
                              <span className="text-gray-600">·</span>
                              <span className="text-[10px]">{getFlag(visitor.country)}</span>
                              <span className="text-[10px] text-gray-400">{visitor.country}{visitor.city ? `, ${visitor.city}` : ''}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-gray-600 font-mono">{maskIP((visitor as any).ipAddress)}</span>
                          <span className="text-gray-600">·</span>
                          <span className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                            <MousePointer2 className="w-3 h-3" />
                            {visitor.currentTitle || visitor.currentPage || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* EXPANDED DETAIL */}
                  {isExpanded && (
                    <div className="px-4 pb-4 lg:px-5 lg:pb-5 bg-white/[0.02] border-t border-white/[0.04] animate-in-up">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                        {/* Visitor Info */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            Ziyaretçi Bilgileri
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
                              <span className="text-gray-500">İsim</span>
                              <p className="text-white font-medium mt-0.5">{detail?.visitorName || visitor.name || 'Anonim'}</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
                              <span className="text-gray-500">E-posta</span>
                              <p className="text-white font-medium mt-0.5 truncate">{detail?.visitorEmail || visitor.email || '—'}</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
                              <span className="text-gray-500">Telefon</span>
                              <p className="text-white font-medium mt-0.5">{detail?.visitorPhone || '—'}</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
                              <span className="text-gray-500">IP Adresi</span>
                              <p className="text-white font-medium mt-0.5 font-mono text-[10px]">{(visitor as any).ipAddress || '—'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Session Info */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            Oturum Bilgileri
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
                              <span className="text-gray-500">Tarayıcı</span>
                              <p className="text-white font-medium mt-0.5">{getBrowserLabel(visitor.browser)}</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
                              <span className="text-gray-500">İşletim Sistemi</span>
                              <p className="text-white font-medium mt-0.5">{visitor.os || '—'}</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
                              <span className="text-gray-500">Cihaz</span>
                              <p className="text-white font-medium mt-0.5">{visitor.device || getDeviceLabel(visitor.device)}</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
                              <span className="text-gray-500">Cihaz Tipi</span>
                              <p className="text-white font-medium mt-0.5 capitalize">{getDeviceLabel(visitor.device)}</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04] col-span-2">
                              <span className="text-gray-500">Konum</span>
                              <p className="text-white font-medium mt-0.5">
                                {getFlag(visitor.country)} {visitor.country || 'Bilinmiyor'}
                                {visitor.city ? `, ${visitor.city}` : ''}
                                {(visitor as any).region ? ` (${(visitor as any).region})` : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Page History */}
                      {detail?.pages && detail.pages.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <LinkIcon className="w-3.5 h-3.5" />
                            Sayfa Geçmişi
                          </h4>
                          <div className="space-y-1.5">
                            {detail.pages.slice(0, 5).map((p: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04] text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                                <span className="text-gray-300 truncate flex-1">{p.title || p.url || '—'}</span>
                                <span className="text-gray-600 shrink-0 text-[10px]">{formatTimeAgo(p.viewedAt)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Referrer */}
                      {visitor.referrer && (
                        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04] text-xs">
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-gray-500">Yönlendiren:</span>
                          <span className="text-gray-300 truncate">{visitor.referrer}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.04]">
                        {detail?.hasConversation && (
                          <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-all">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Sohbet Başlat
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleBan((visitor as any).ipAddress) }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Ziyaretçiyi Engelle
                        </button>
                        <span className="text-[10px] text-gray-600 ml-auto">
                          {visitor.startedAt && `Başlangıç: ${new Date(visitor.startedAt).toLocaleString('tr-TR')}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
