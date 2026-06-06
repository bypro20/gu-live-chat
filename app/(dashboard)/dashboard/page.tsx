'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import {
  MessageSquare, Clock, Eye, Zap, Monitor, Users, Bot,
  ArrowRight, Copy, Check, Inbox,
} from 'lucide-react'

export default function DashboardPage() {
  const { stats, isLoading } = useDashboardStats()
  const { activeWebsite } = useActiveWebsite()
  const [copiedCode, setCopiedCode] = useState(false)

  const resolvedRate = stats.totalConversations > 0
    ? Math.round((stats.resolvedConversations / stats.totalConversations) * 100)
    : 0

  const statCards = [
    { label: 'Açık Sohbetler', value: stats.openConversations, icon: MessageSquare, color: 'text-primary', bg: 'bg-primary-light' },
    { label: 'Bugünkü Sohbetler', value: stats.todayConversations, icon: Inbox, color: 'text-success', bg: 'bg-success-light' },
    { label: 'Aktif Ziyaretçiler', value: stats.activeVisitors, icon: Eye, color: 'text-info', bg: 'bg-info-light', href: '/visitors', live: stats.activeVisitors > 0 },
    { label: 'Ort. Yanıt Süresi', value: stats.avgResponseTime, icon: Clock, color: 'text-warning', bg: 'bg-warning-light', isText: true },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Genel Bakış</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {activeWebsite ? `${activeWebsite.name} · ` : ''}Canlı destek performansınız
          </p>
        </div>
        <Link href="/inbox" className="btn-primary">
          <MessageSquare className="w-4 h-4" /> Gelen Kutusunu Aç
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const inner = (
            <div className="surface p-5 hover:shadow-md transition-shadow h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-muted-foreground flex-1">{card.label}</span>
                {card.live && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold tabular-nums">
                {isLoading ? <span className="animate-pulse text-muted-foreground">—</span> : card.isText ? card.value : card.value}
              </p>
              {card.href && !isLoading && (
                <p className="text-xs text-primary mt-1 flex items-center gap-1">Canlı izleme <ArrowRight className="w-3 h-3" /></p>
              )}
            </div>
          )
          return card.href ? <Link key={card.label} href={card.href}>{inner}</Link> : <div key={card.label}>{inner}</div>
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="surface p-6">
            <h2 className="text-base font-bold mb-4">Hızlı Başlangıç</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { href: '/settings/widget', icon: Monitor, label: 'Widget', desc: 'Görünümü özelleştir' },
                { href: '/settings/team', icon: Users, label: 'Takım', desc: 'Üye davet edin' },
                { href: '/settings/chatbot', icon: Bot, label: 'Chatbot', desc: 'Otomatik yanıtlar' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-primary-light/30 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{item.label}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="surface p-6">
            <h2 className="text-base font-bold mb-3">Widget Kurulumu</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Aşağıdaki kodu sitenizin <code className="text-xs bg-primary-light text-primary px-1.5 py-0.5 rounded font-mono">&lt;head&gt;</code> etiketinden önce ekleyin:
            </p>
            <div className="relative">
              <button
                onClick={() => {
                  const code = `<script>
  window.$gu = window.$gu || function() {
    (window.$gu.q = window.$gu.q || []).push(arguments);
  };
  $gu('set', 'WEBSITE_ID', '${activeWebsite?.websiteId || 'YOUR_WEBSITE_ID'}');
</script>
<script async src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js"></script>`
                  navigator.clipboard.writeText(code).then(() => {
                    setCopiedCode(true)
                    setTimeout(() => setCopiedCode(false), 2000)
                  })
                }}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card border border-border hover:bg-muted transition-colors z-10"
              >
                {copiedCode ? <><Check className="w-3.5 h-3.5 text-success" /><span className="text-success">Kopyalandı</span></> : <><Copy className="w-3.5 h-3.5" /><span>Kopyala</span></>}
              </button>
              <div className="bg-[#0F172A] rounded-xl p-4 overflow-x-auto">
                <pre className="text-[13px] text-emerald-400 font-mono leading-relaxed">{`<script>
  window.$gu = window.$gu || function() {
    (window.$gu.q = window.$gu.q || []).push(arguments);
  };
  $gu('set', 'WEBSITE_ID', '${activeWebsite?.websiteId || 'YOUR_WEBSITE_ID'}');
</script>
<script async src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js"></script>`}</pre>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface p-6">
            <h2 className="text-base font-bold mb-4">Performans</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Toplam sohbet</span>
                  <span className="font-medium text-foreground">{isLoading ? '—' : stats.totalConversations}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(stats.totalConversations, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Çözüm oranı</span>
                  <span className="font-medium text-foreground">{isLoading ? '—' : `%${resolvedRate}`}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full transition-all" style={{ width: `${resolvedRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="surface p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">Plan</h2>
              <Link href="/settings/billing" className="text-xs font-semibold text-primary hover:text-primary-hover">Yükselt →</Link>
            </div>
            <p className="text-sm font-semibold">Ücretsiz</p>
            <div className="mt-3 bg-primary-light rounded-xl p-3 border border-primary/10">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Sohbet kullanımı</span>
                <span>{isLoading ? '—' : `${stats.totalConversations} / 100`}</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${Math.min((stats.totalConversations / 100) * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="surface p-6">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Son aktivite
            </h2>
            <p className="text-sm text-muted-foreground">
              {stats.todayConversations > 0
                ? `Bugün ${stats.todayConversations} yeni sohbet alındı.`
                : 'Henüz bugün sohbet yok. Widget\'ınızı sitenize ekleyin.'}
            </p>
            {stats.openConversations > 0 && (
              <Link href="/inbox" className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-3 hover:text-primary-hover">
                {stats.openConversations} açık sohbet <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
