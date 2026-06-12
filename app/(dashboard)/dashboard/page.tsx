'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { PLANS, PLAN_LIMITS } from '@/lib/constants'
import { buildWidgetInstallSnippet } from '@/lib/widget-snippet'
import { channelColor } from '@/lib/conversation-channels'
import {
  MessageSquare,
  Clock,
  Eye,
  Zap,
  Monitor,
  Users,
  Bot,
  ArrowRight,
  Copy,
  Check,
  Inbox,
  Sparkles,
  Radio,
  TrendingUp,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { GrowthOpportunities } from '@/components/dashboard/growth-opportunities'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'

export default function DashboardPage() {
  const { data: session } = useSession()
  const { stats, isLoading } = useDashboardStats()
  const { activeWebsite } = useActiveWebsite()
  const [copiedCode, setCopiedCode] = useState(false)
  const t = useDashboardI18n().dashboard

  const resolvedRate =
    stats.totalConversations > 0
      ? Math.round((stats.resolvedConversations / stats.totalConversations) * 100)
      : 0

  const planKey = (activeWebsite?.plan || 'FREE') as keyof typeof PLAN_LIMITS
  const planInfo = PLANS.find((p) => p.id === planKey)
  const convLimit = PLAN_LIMITS[planKey]?.maxConversationsPerMonth
  const convLimitLabel = convLimit === Infinity ? t.unlimited : String(convLimit)
  const installSnippet = buildWidgetInstallSnippet(activeWebsite?.websiteId || 'YOUR_WEBSITE_ID')

  const channelMax = Math.max(...stats.channelBreakdown.map((c) => c.count), 1)

  const statCards = [
    {
      label: t.openChats,
      value: stats.openConversations,
      icon: MessageSquare,
      color: 'text-primary',
      bg: 'bg-primary-light',
    },
    {
      label: t.todayChats,
      value: stats.todayConversations,
      icon: Inbox,
      color: 'text-success',
      bg: 'bg-success-light',
    },
    {
      label: t.activeVisitors,
      value: stats.activeVisitors,
      icon: Eye,
      color: 'text-info',
      bg: 'bg-info-light',
      href: '/visitors',
      live: stats.activeVisitors > 0,
    },
    {
      label: t.avgFirstResponse,
      value: stats.avgResponseTime,
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning-light',
      isText: true,
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Hoş geldin banner */}
      <div className="app-welcome-banner animate-in-up">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              {t.controlCenter}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {session?.user?.name ? t.welcomeWithName(session.user.name.split(' ')[0]) : t.welcome}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm max-w-lg">
              {activeWebsite ? t.subtitleWithSite(activeWebsite.name) : t.subtitleDefault}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href="/settings/channels">
              <Button variant="outline" size="sm" className="gap-1.5 bg-card/80">
                <Radio className="w-4 h-4" />
                {t.channels}
              </Button>
            </Link>
            <Link href="/inbox" className="btn-primary">
              <MessageSquare className="w-4 h-4" /> {t.inbox}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const inner = (
            <div className="app-stat-card h-full">
              <div className="relative flex items-center gap-3 mb-3">
                <div
                  className={`w-11 h-11 rounded-xl ${card.bg} ${card.color} flex items-center justify-center ring-1 ring-black/[0.04]`}
                >
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
              <p className="relative text-3xl font-bold tabular-nums tracking-tight">
                {isLoading ? (
                  <span className="animate-pulse text-muted-foreground">—</span>
                ) : (
                  card.value
                )}
              </p>
              {card.href && !isLoading && (
                <p className="relative text-xs text-primary mt-2 flex items-center gap-1 font-medium">
                  {t.liveMonitoring} <ArrowRight className="w-3 h-3" />
                </p>
              )}
            </div>
          )
          return card.href ? (
            <Link key={card.label} href={card.href}>
              {inner}
            </Link>
          ) : (
            <div key={card.label}>{inner}</div>
          )
        })}
      </div>

      <div className="mb-8">
        <GrowthOpportunities />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Kanal dağılımı */}
          <div className="app-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {t.channelDistribution}
              </h2>
              <span className="text-xs text-muted-foreground">{t.thisMonth}</span>
            </div>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t.loading}</p>
            ) : stats.channelBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noChatsYet}</p>
            ) : (
              <div className="space-y-3">
                {stats.channelBreakdown.map((ch) => (
                  <div key={ch.source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{ch.label}</span>
                      <span className="text-muted-foreground tabular-nums">{ch.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(ch.count / channelMax) * 100}%`,
                          backgroundColor: channelColor(ch.source),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/settings/channels"
              className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-4 hover:text-primary-hover"
            >
              {t.connectChannels} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Temsilci performansı */}
          <div className="app-panel p-6">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              {t.agentPerformance}
            </h2>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t.loading}</p>
            ) : stats.agentPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noAgentActivity}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="pb-2 font-medium">{t.agent}</th>
                      <th className="pb-2 font-medium text-right">{t.messages}</th>
                      <th className="pb-2 font-medium text-right">{t.resolved}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.agentPerformance.map((agent) => (
                      <tr key={agent.userId || agent.name} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={agent.image}
                              fallback={agent.name}
                              size="sm"
                              className="!from-primary/30 !to-primary/50"
                            />
                            <span className="font-medium">{agent.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right tabular-nums">{agent.messagesSent}</td>
                        <td className="py-2.5 text-right tabular-nums text-success">{agent.resolved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="app-panel p-6">
            <h2 className="text-base font-bold mb-3">{t.widgetSetup}</h2>
            {activeWebsite ? (
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-medium text-foreground">{t.embedCodeFor(activeWebsite.name)}</span>
              </p>
            ) : null}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(installSnippet).then(() => {
                    setCopiedCode(true)
                    setTimeout(() => setCopiedCode(false), 2000)
                  })
                }}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-card border border-border hover:bg-muted transition-colors z-10"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-success" />
                    <span className="text-success">{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.copy}</span>
                  </>
                )}
              </button>
              <div className="bg-[#0F172A] rounded-xl p-4 overflow-x-auto">
                <pre className="text-[13px] text-emerald-400 font-mono leading-relaxed">
                  {installSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* AI Agent */}
          <div className="app-panel p-6 border-primary/10">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">{t.aiAgent}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t.aiAgentSubtitle}</p>
              </div>
            </div>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">…</p>
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums mb-1">
                  %{stats.aiMetrics.aiResolutionRate}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {t.aiResolutionRate(stats.aiMetrics.aiResolutionRate, stats.aiMetrics.botReplies)}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      stats.aiAgent.active && stats.aiAgent.autoReply
                        ? 'bg-success animate-pulse'
                        : 'bg-muted-foreground/40'
                    }`}
                  />
                  <span className="text-sm">
                    {stats.aiAgent.active && stats.aiAgent.autoReply
                      ? t.aiActiveAuto
                      : stats.aiAgent.active
                        ? t.aiActiveManual
                        : t.aiOff}
                  </span>
                </div>
                <Link href="/settings/chatbot">
                  <Button variant="outline" size="sm" className="w-full">
                    {t.aiSettings}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="app-panel p-6">
            <h2 className="text-base font-bold mb-4">{t.performance}</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{t.totalChatsMonth}</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {isLoading ? '—' : stats.totalConversations}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(stats.totalConversations, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{t.resolutionRate}</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {isLoading ? '—' : `%${resolvedRate}`}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all"
                    style={{ width: `${resolvedRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="app-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">{t.plan}</h2>
              <Link
                href="/settings/plans"
                className="text-xs font-semibold text-primary hover:text-primary-hover"
              >
                {t.upgrade}
              </Link>
            </div>
            <p className="text-sm font-semibold">{planInfo?.name || t.freePlan}</p>
            <div className="mt-3 bg-primary-light rounded-xl p-3 border border-primary/10">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{t.chatUsageMonth}</span>
                <span>
                  {isLoading ? '—' : `${stats.totalConversations} / ${convLimitLabel}`}
                </span>
              </div>
              {convLimit !== Infinity && (
                <div className="w-full bg-border rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((stats.totalConversations / convLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="app-panel p-6">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> {t.quickAccess}
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {[
                { href: '/settings/widget', icon: Monitor, label: t.quickWidget },
                { href: '/settings/team', icon: Users, label: t.quickTeam },
                { href: '/settings/chatbot', icon: Bot, label: t.quickChatbot },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-muted transition text-sm"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
