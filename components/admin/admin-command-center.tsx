'use client'

import Link from 'next/link'
import {
  Activity, Users, Globe, Shield, ArrowRight, TrendingUp, Target, BarChart3, Zap,
  Wifi, Database, Radio,
} from 'lucide-react'
import { ADMIN_MODULES, type AdminModule } from '@/lib/admin-navigation'
import { LiveVisitorsSummary } from '@/components/visitors/live-visitors-summary'
import { TRIAL_DAYS } from '@/lib/trial-config'

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  users: Users,
  chart: BarChart3,
  widget: Globe,
  shield: Shield,
}

const ACCENT: Record<AdminModule['accent'], { border: string; bg: string; text: string; glow: string }> = {
  violet: { border: 'border-violet-500/20', bg: 'bg-violet-500/10', text: 'text-violet-400', glow: 'from-violet-500/20' },
  emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'from-emerald-500/20' },
  sky: { border: 'border-sky-500/20', bg: 'bg-sky-500/10', text: 'text-sky-400', glow: 'from-sky-500/20' },
  amber: { border: 'border-amber-500/20', bg: 'bg-amber-500/10', text: 'text-amber-400', glow: 'from-amber-500/20' },
  rose: { border: 'border-rose-500/20', bg: 'bg-rose-500/10', text: 'text-rose-400', glow: 'from-rose-500/20' },
  cyan: { border: 'border-cyan-500/20', bg: 'bg-cyan-500/10', text: 'text-cyan-400', glow: 'from-cyan-500/20' },
}

export interface CommandCenterStats {
  totalUsers: number
  totalWebsites: number
  totalConversations: number
  totalMessages: number
  activeVisitors: number
  totalRevenue: number
  addonRevenue: number
  paidWebsites: number
  trialWebsites: number
  bannedUsers: number
  totalIpBans: number
  inboxUnread: number
  trialFunnel: {
    activeTrials: number
    conversionRate: number
    widgetBonusRate: number
    expiringWithin48h: number
  }
  recentUsers: Array<{ id: string; email: string; name: string | null; role: string; _count: { websites: number } }>
  recentWebsites: Array<{ id: string; name: string; domain: string; plan: string; owner: { email: string } | null }>
  planDistribution: { plan: string; count: number }[]
}

interface AdminCommandCenterProps {
  stats: CommandCenterStats
  health: { ok: boolean; db: boolean; socket: boolean }
  lastUpdated: Date
}

function PulseMetric({
  href,
  label,
  value,
  sub,
  accent,
  alert,
}: {
  href: string
  label: string
  value: string | number
  sub?: string
  accent: string
  alert?: boolean
}) {
  return (
    <Link
      href={href}
      className={`admin-pulse-metric group ${alert ? 'admin-pulse-metric--alert' : ''}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider admin-text-muted group-hover:admin-text-secondary">{label}</p>
      <p className={`text-2xl font-bold tabular-nums mt-1 ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] admin-text-faint mt-0.5">{sub}</p>}
    </Link>
  )
}

export function AdminCommandCenter({ stats, health, lastUpdated }: AdminCommandCenterProps) {
  const totalRevenue = stats.totalRevenue + stats.addonRevenue

  return (
    <div className="admin-command-center max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
      {/* Hero */}
      <section className="admin-command-hero">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="admin-live-pill">
                <span className="admin-live-dot" />
                Platform aktif
              </span>
              <span className="text-[11px] admin-text-muted">
                Güncelleme {lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold admin-text tracking-tight">
              Komuta Merkezi
            </h1>
            <p className="text-sm admin-text-muted mt-1 max-w-xl">
              Tüm platformu tek ekrandan izleyin — canlı ziyaretçiler, mesajlar, müşteriler, gelir ve sistem sağlığı.
            </p>
          </div>
          <Link
            href="/admin/platform"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shrink-0"
          >
            <BarChart3 className="w-4 h-4" />
            Platform Merkezi (A-Z)
          </Link>
        </div>

        <div className="admin-pulse-strip">
          <PulseMetric
            href="/admin/visitors"
            label="Canlı Ziyaretçi"
            value={stats.activeVisitors}
            accent="text-emerald-400"
            alert={stats.activeVisitors > 0}
          />
          <PulseMetric
            href="/admin/inbox"
            label="Okunmamış Mesaj"
            value={stats.inboxUnread}
            accent="text-violet-400"
            alert={stats.inboxUnread > 0}
          />
          <PulseMetric
            href="/admin/users"
            label="Kullanıcı"
            value={stats.totalUsers.toLocaleString()}
            sub={`${stats.bannedUsers} banlı`}
            accent="text-sky-400"
          />
          <PulseMetric
            href="/admin/websites"
            label="Site"
            value={stats.totalWebsites.toLocaleString()}
            sub={`${stats.paidWebsites} ücretli · ${stats.trialWebsites} deneme`}
            accent="text-cyan-400"
          />
          <PulseMetric
            href="/admin/conversations"
            label="Sohbet"
            value={stats.totalConversations.toLocaleString()}
            sub={`${stats.totalMessages.toLocaleString()} mesaj`}
            accent="text-orange-400"
          />
          <PulseMetric
            href="/admin/platform"
            label="Gelir"
            value={`₺${totalRevenue.toLocaleString()}`}
            accent="text-emerald-400"
          />
        </div>
      </section>

      {/* Modül haritası */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold admin-text flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Tüm Modüller
            </h2>
            <p className="text-xs admin-text-muted mt-0.5">Platformun her alanına doğrudan erişim</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ADMIN_MODULES.map((mod) => {
            const Icon = MODULE_ICONS[mod.icon] || Activity
            const a = ACCENT[mod.accent]
            return (
              <div
                key={mod.id}
                className={`admin-module-card border ${a.border} bg-gradient-to-br ${a.glow} to-transparent`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl ${a.bg} ${a.text}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold admin-text">{mod.title}</h3>
                    <p className="text-xs admin-text-muted mt-0.5">{mod.description}</p>
                  </div>
                </div>
                <ul className="space-y-1">
                  {mod.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="admin-module-link group"
                        {...(link.href.startsWith('/api') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="text-sm font-medium admin-text-secondary group-hover:admin-text">{link.label}</span>
                          {link.description && (
                            <span className="block text-[10px] admin-text-faint truncate">{link.description}</span>
                          )}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 admin-text-faint group-hover:text-violet-400 shrink-0 transition-colors" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <LiveVisitorsSummary variant="admin" limit={6} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentList
              title="Son Kullanıcılar"
              icon={Users}
              iconColor="text-blue-400"
              href="/admin/users"
              empty="Henüz kullanıcı yok"
              items={stats.recentUsers.slice(0, 6).map((u) => ({
                key: u.id,
                primary: u.name || 'İsimsiz',
                secondary: u.email,
                meta: `${u._count.websites} site · ${u.role === 'ADMIN' ? 'Admin' : 'Kullanıcı'}`,
              }))}
            />
            <RecentList
              title="Son Siteler"
              icon={Globe}
              iconColor="text-sky-400"
              href="/admin/websites"
              empty="Henüz site yok"
              items={stats.recentWebsites.slice(0, 6).map((w) => ({
                key: w.id,
                primary: w.name,
                secondary: w.domain,
                meta: `${w.plan} · ${w.owner?.email || 'Sahipsiz'}`,
              }))}
            />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="admin-panel-card">
            <h3 className="text-sm font-bold admin-text flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-violet-400" />
              Deneme Hunisi
            </h3>
            <p className="text-[11px] admin-text-muted mb-4">{TRIAL_DAYS} gün PRO deneme · widget & sohbet bonusları</p>
            <div className="space-y-3">
              <MetricRow label="Aktif deneme" value={stats.trialFunnel.activeTrials} highlight />
              <MetricRow label="48s içinde biten" value={stats.trialFunnel.expiringWithin48h} warn />
              <MetricRow label="Dönüşüm oranı" value={`%${stats.trialFunnel.conversionRate}`} />
              <MetricRow label="Widget aktivasyonu" value={`%${stats.trialFunnel.widgetBonusRate}`} />
            </div>
            <Link href="/admin/platform" className="admin-text-link mt-4">
              Detaylı analiz <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="admin-panel-card">
            <h3 className="text-sm font-bold admin-text flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Plan Dağılımı
            </h3>
            <div className="space-y-3">
              {stats.planDistribution.length === 0 ? (
                <p className="text-xs admin-text-muted">Veri yok</p>
              ) : (
                stats.planDistribution.map((p) => (
                  <div key={p.plan}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold admin-text-secondary">{p.plan}</span>
                      <span className="admin-text-muted tabular-nums">{p.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--admin-bg-hover)' }}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                        style={{
                          width: `${Math.max(8, (p.count / Math.max(stats.totalWebsites, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="admin-panel-card">
            <h3 className="text-sm font-bold admin-text flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-amber-400" />
              Güvenlik Özeti
            </h3>
            <div className="space-y-3">
              <MetricRow label="Banlı kullanıcı" value={stats.bannedUsers} href="/admin/users" />
              <MetricRow label="IP engeli" value={stats.totalIpBans} href="/admin/ip-bans" />
            </div>
          </div>

          <SystemHealth health={health} />
        </aside>
      </div>
    </div>
  )
}

function MetricRow({
  label,
  value,
  highlight,
  warn,
  href,
}: {
  label: string
  value: string | number
  highlight?: boolean
  warn?: boolean
  href?: string
}) {
  const inner = (
    <div className="flex items-center justify-between text-sm">
      <span className="admin-text-muted">{label}</span>
      <span className={`font-bold tabular-nums ${
        highlight ? 'text-violet-400' : warn ? 'text-amber-400' : 'admin-text'
      }`}>
        {value}
      </span>
    </div>
  )
  if (href) {
    return (
      <Link href={href} className="admin-metric-row-link block -mx-2 px-2 py-1 rounded-lg transition-colors">
        {inner}
      </Link>
    )
  }
  return inner
}

function RecentList({
  title,
  icon: Icon,
  iconColor,
  href,
  empty,
  items,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  href: string
  empty: string
  items: { key: string; primary: string; secondary: string; meta: string }[]
}) {
  return (
    <div className="admin-panel-card overflow-hidden p-0">
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--admin-border)' }}>
        <h3 className="text-sm font-bold admin-text flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          {title}
        </h3>
        <Link href={href} className="admin-text-link text-xs">
          Tümü <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="p-8 text-center text-sm admin-text-muted">{empty}</p>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--admin-border)' }}>
          {items.map((item) => (
            <li key={item.key} className="px-5 py-3 transition-colors hover:opacity-95" style={{ borderColor: 'var(--admin-border)' }}>
              <p className="text-sm font-medium admin-text truncate">{item.primary}</p>
              <p className="text-xs admin-text-muted truncate">{item.secondary}</p>
              <p className="text-[10px] admin-text-faint mt-0.5">{item.meta}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SystemHealth({ health }: { health: { ok: boolean; db: boolean; socket: boolean } }) {
  const allOk = health.ok && health.db
  return (
    <div className="admin-panel-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold admin-text">Sistem Durumu</h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          allOk ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
        }`}>
          {allOk ? 'Sağlıklı' : 'Dikkat'}
        </span>
      </div>
      <div className="space-y-2 text-xs">
        <HealthRow ok={health.ok} icon={Wifi} label="API" />
        <HealthRow ok={health.db} icon={Database} label="Veritabanı" />
        <HealthRow ok={health.socket} icon={Radio} label="Canlı bağlantı" warnWhenOff />
      </div>
    </div>
  )
}

function HealthRow({
  ok,
  icon: Icon,
  label,
  warnWhenOff,
}: {
  ok: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  warnWhenOff?: boolean
}) {
  const color = ok ? 'text-emerald-400' : warnWhenOff ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 admin-text-muted">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        {label}
      </span>
      <span className={`font-medium ${color}`}>
        {ok ? 'Aktif' : warnWhenOff ? 'Polling' : 'Sorunlu'}
      </span>
    </div>
  )
}
