'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Globe, Monitor, Smartphone, Tablet, Globe2, Clock,
  Users, Activity, Eye, RefreshCw,
} from 'lucide-react'
import { getDeviceLabel, getBrowserLabel, formatDuration } from '@/lib/visitors-utils'
import type { LiveVisitor } from '@/lib/stores/live-visitors-store'
import { AdminVisitorsMonitor } from '@/components/admin/admin-visitors-monitor'

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
  opera: 'bg-red-500/15 text-red-400 border-red-500/30',
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

function getFlag(country?: string | null): string {
  if (!country) return '🌍'
  const c = country.toUpperCase()
  return countryMap[c]?.flag || '🌍'
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

const TIME_SINCE: Record<string, string | null> = {
  '1s': null,
  '24h': '24h',
  '7d': '7d',
}

export default function AdminVisitorsPage() {
  const [visitors, setVisitors] = useState<LiveVisitor[]>([])
  const [historySessions, setHistorySessions] = useState<HistorySession[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('24h')
  const [mapHover, setMapHover] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const since = TIME_SINCE[timeFilter]
      const historyUrl = since
        ? `/api/admin/visitors/history?page=1&limit=100&since=${since}`
        : '/api/admin/visitors/history?page=1&limit=50'
      const [liveRes, historyRes] = await Promise.all([
        fetch('/api/admin/visitors/live'),
        fetch(historyUrl),
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
  }, [timeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const interval = setInterval(fetchData, timeFilter === '1s' ? 10000 : 30000)
    return () => clearInterval(interval)
  }, [fetchData, timeFilter])

  const timeCutoff = timeFilter === '24h'
    ? Date.now() - 24 * 60 * 60 * 1000
    : timeFilter === '7d'
      ? Date.now() - 7 * 24 * 60 * 60 * 1000
      : null

  const filteredVisitors = visitors.filter(v => {
    if (timeCutoff && v.lastActiveAt) {
      if (new Date(v.lastActiveAt).getTime() < timeCutoff) return false
    }
    if (timeFilter === '1s' && v.lastActiveAt) {
      if (Date.now() - new Date(v.lastActiveAt).getTime() > 300000) return false
    }
    return true
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

        <div className="relative overflow-hidden bg-gradient-to-br from-sky-500/[0.07] to-sky-500/[0.02] border border-sky-500/20 rounded-2xl p-4 lg:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-sky-400/80 tracking-wide">Toplam Oturum</p>
              <p className="text-2xl lg:text-3xl font-bold text-white mt-1 tabular-nums tracking-tight">{totalSessions}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400 border border-sky-500/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400/40 to-transparent" />
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

            {sortedVisitors
              .filter((v) => v.latitude != null && v.longitude != null)
              .map((v) => {
                const x = ((v.longitude! + 180) / 360) * 100
                const y = ((90 - v.latitude!) / 180) * 100
                return (
                  <div
                    key={`geo-${v.visitorId}`}
                    className="absolute w-2 h-2 rounded-full bg-sky-400 ring-2 ring-sky-300/40 -translate-x-1/2 -translate-y-1/2 animate-pulse"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    title={`${v.name || 'Anonim'} — ${v.city || v.country || ''}`}
                  />
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
                  Tablet: { bar: 'bg-gradient-to-r from-sky-500 to-sky-400', text: 'text-sky-400', icon: Tablet },
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

      {/* CANLI İZLEME — ekran, sayfa geçmişi, konum */}
      <AdminVisitorsMonitor />
    </div>
  )
}
