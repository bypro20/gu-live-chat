'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  Megaphone,
  CheckCircle2,
  XCircle,
  Bot,
  Play,
  Zap,
} from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { OrganicMarketingHealthPanel } from '@/components/admin/marketing-health-panel'
import { useToast } from '@/lib/toast'
import type {
  ContentTask,
  ContentTaskStatus,
  OrganicMarketingPlan,
} from '@/lib/organic-marketing/types'

type AutomationConfig = {
  enabled: boolean
  autoPublishBlog: boolean
  blogIntervalDays: number
  autoDispatchSocial: boolean
  webhookUrl: string
  notifyEmail: string
  lastRunAt: string | null
  lastRunSummary: string | null
  runCount: number
}

const CHANNEL_LABELS: Record<string, string> = {
  blog: 'Blog',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  x: 'X',
}

const STATUS_LABELS: Record<ContentTaskStatus, string> = {
  draft: 'Taslak',
  approved: 'Onaylı',
  published: 'Yayınlandı',
  skipped: 'Atlandı',
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-600/80 text-white text-xs hover:bg-violet-500"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'OK' : 'Kopyala'}
    </button>
  )
}

function formatTaskForCopy(task: ContentTask) {
  const lines = [
    task.title,
    '',
    task.hook,
    '',
    task.body,
    '',
    task.cta,
  ]
  if (task.landingUrl) lines.push('', task.landingUrl)
  if (task.hashtags?.length) lines.push('', task.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' '))
  return lines.join('\n')
}

export default function AdminOrganicMarketingPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [plan, setPlan] = useState<OrganicMarketingPlan | null>(null)
  const [aiAvailable, setAiAvailable] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [automation, setAutomation] = useState<AutomationConfig | null>(null)
  const [savingAutomation, setSavingAutomation] = useState(false)
  const [runningBot, setRunningBot] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [planRes, autoRes] = await Promise.all([
        fetch('/api/admin/organic-marketing'),
        fetch('/api/admin/organic-marketing/automation'),
      ])
      const data = await planRes.json()
      const autoData = await autoRes.json()
      if (!planRes.ok) throw new Error(data.error || 'Yüklenemedi')
      setPlan(data.plan)
      setAiAvailable(Boolean(data.aiAvailable))
      if (autoRes.ok) setAutomation(autoData.config)
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Plan yüklenemedi', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const sortedCalendar = useMemo(() => {
    if (!plan?.calendar) return []
    return [...plan.calendar].sort((a, b) => b.date.localeCompare(a.date))
  }, [plan?.calendar])

  const handleGenerate = async (forceSeed = false) => {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/organic-marketing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceSeed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Üretilemedi')
      setPlan(data.plan)
      toast({ title: data.message || 'Strateji güncellendi', variant: 'success' })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Hata', variant: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  const handleCalendar = async () => {
    setCalendarLoading(true)
    try {
      const res = await fetch('/api/admin/organic-marketing/calendar', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Takvim üretilemedi')
      setPlan(data.plan)
      toast({ title: data.message || 'Takvim güncellendi', variant: 'success' })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Hata', variant: 'error' })
    } finally {
      setCalendarLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, status: ContentTaskStatus) => {
    setUpdatingId(taskId)
    try {
      const res = await fetch(`/api/admin/organic-marketing/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Güncellenemedi')
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              calendar: prev.calendar.map((t) => (t.id === taskId ? data.task : t)),
            }
          : prev
      )
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Hata', variant: 'error' })
    } finally {
      setUpdatingId(null)
    }
  }

  const saveAutomation = async (patch: Partial<AutomationConfig>) => {
    if (!automation) return
    setSavingAutomation(true)
    try {
      const res = await fetch('/api/admin/organic-marketing/automation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kaydedilemedi')
      setAutomation(data.config)
      toast({ title: 'Otomasyon ayarları kaydedildi', variant: 'success' })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Hata', variant: 'error' })
    } finally {
      setSavingAutomation(false)
    }
  }

  const runBotNow = async () => {
    setRunningBot(true)
    try {
      const res = await fetch('/api/admin/organic-marketing/automation', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Çalıştırılamadı')
      toast({ title: data.report?.summary || 'Bot tamamlandı', variant: 'success' })
      await load()
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Hata', variant: 'error' })
    } finally {
      setRunningBot(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-page flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    )
  }

  return (
    <div className="admin-page max-w-5xl space-y-8 pb-12">
      <div>
        <Link
          href="/admin/marketing"
          className="inline-flex items-center gap-1.5 text-sm admin-text-muted hover:admin-text mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Pazarlama merkezi
        </Link>
        <AdminPageHeader
          title="Organik Pazarlama Otomasyonu"
          description="gulivechat.com için hedef kitle, strateji ve günlük içerik takvimi — Mazlum modeli"
        />
      </div>

      <section className="rounded-2xl border border-emerald-700/50 bg-emerald-950/20 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Otomatik Bot (7/24)
        </h2>
        <p className="text-sm text-slate-400">
          Tam otomatik: cron günde 4 kez (07:00, 13:00, 19:00, 01:00 TR). Blog yayınlanır; Instagram, LinkedIn ve Facebook’a doğrudan post atılır.
        </p>

        {automation && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={automation.enabled}
                onChange={(e) => saveAutomation({ enabled: e.target.checked })}
                disabled={savingAutomation}
                className="rounded"
              />
              <span className="text-sm text-white">Otomasyon aktif</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={automation.autoPublishBlog}
                onChange={(e) => saveAutomation({ autoPublishBlog: e.target.checked })}
                disabled={savingAutomation}
                className="rounded"
              />
              <span className="text-sm text-white">Blog otomatik yayınla</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={automation.autoDispatchSocial}
                onChange={(e) => saveAutomation({ autoDispatchSocial: e.target.checked })}
                disabled={savingAutomation}
                className="rounded"
              />
              <span className="text-sm text-white">Sosyal içerik otomatik gönder</span>
            </label>
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
              <label className="text-xs text-slate-500 block mb-1">Blog aralığı (gün)</label>
              <select
                value={automation.blogIntervalDays}
                onChange={(e) => saveAutomation({ blogIntervalDays: Number(e.target.value) })}
                disabled={savingAutomation}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white"
              >
                {[1, 2, 3, 5, 7].map((d) => (
                  <option key={d} value={d}>{d} günde bir</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {automation && (
          <div className="space-y-2">
            <label className="text-xs text-slate-500">Webhook URL (Zapier/Make → Instagram/LinkedIn)</label>
            <input
              type="url"
              value={automation.webhookUrl}
              onChange={(e) => setAutomation({ ...automation, webhookUrl: e.target.value })}
              onBlur={() => saveAutomation({ webhookUrl: automation.webhookUrl })}
              placeholder="https://hooks.zapier.com/..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <label className="text-xs text-slate-500">Bildirim e-postası (webhook yoksa)</label>
            <input
              type="email"
              value={automation.notifyEmail}
              onChange={(e) => setAutomation({ ...automation, notifyEmail: e.target.value })}
              onBlur={() => saveAutomation({ notifyEmail: automation.notifyEmail })}
              placeholder="destek@gulivechat.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={runningBot}
            onClick={runBotNow}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
          >
            {runningBot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Şimdi çalıştır
          </button>
          {automation?.lastRunAt && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Son: {new Date(automation.lastRunAt).toLocaleString('tr-TR')}
              {automation.lastRunSummary ? ` — ${automation.lastRunSummary}` : ''}
              {automation.runCount ? ` (${automation.runCount} çalışma)` : ''}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600">
          Vercel env: <code className="text-violet-300">ORGANIC_MARKETING_WEBHOOK_URL</code>,{' '}
          <code className="text-violet-300">ORGANIC_MARKETING_NOTIFY_EMAIL</code>,{' '}
          <code className="text-violet-300">GEMINI_API_KEY</code>
        </p>

        <OrganicMarketingHealthPanel />
      </section>

      <section className="rounded-2xl border border-violet-700/40 bg-violet-950/20 p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${aiAvailable ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}
          >
            AI: {aiAvailable ? 'Hazır (GEMINI)' : 'Kapalı — hazır strateji'}
          </span>
          {plan?.source && (
            <span className="text-xs text-slate-500">
              Kaynak: {plan.source === 'ai' ? 'AI üretimi' : plan.source === 'seed' ? 'Hazır şablon' : 'Manuel'}
              · {plan.generatedAt ? new Date(plan.generatedAt).toLocaleString('tr-TR') : ''}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={generating}
            onClick={() => handleGenerate(false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI ile strateji üret
          </button>
          <button
            type="button"
            disabled={generating}
            onClick={() => handleGenerate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Hazır şablonu yükle
          </button>
          <button
            type="button"
            disabled={calendarLoading}
            onClick={handleCalendar}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-700/50 text-emerald-300 text-sm hover:bg-emerald-950/40 disabled:opacity-50"
          >
            {calendarLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            7 günlük takvim yenile
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Cron: <code className="text-violet-300">/api/cron/organic-marketing</code> — günde 4 kez (içerik üret, blog yayınla, sosyal gönder).
        </p>
      </section>

      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-violet-400" />
          Ürün özeti (AI bağlamı)
        </h2>
        <pre className="text-xs text-slate-400 whitespace-pre-wrap max-h-48 overflow-y-auto bg-slate-950/50 p-4 rounded-xl border border-slate-800">
          {plan?.productBrief}
        </pre>
      </section>

      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          Hedef kitleler ({plan?.audiences.length ?? 0})
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {plan?.audiences.map((aud) => (
            <div key={aud.id} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <p className="font-medium text-white">{aud.name}</p>
              <p className="text-xs text-slate-400">{aud.description}</p>
              <div className="flex flex-wrap gap-1">
                {aud.channels.map((c) => (
                  <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {CHANNEL_LABELS[c] ?? c}
                  </span>
                ))}
              </div>
              <ul className="text-xs text-slate-500 list-disc pl-4 space-y-0.5">
                {aud.painPoints.slice(0, 3).map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Organik stratejiler</h2>
        <div className="space-y-4">
          {plan?.strategies.map((str) => {
            const aud = plan.audiences.find((a) => a.id === str.audienceId)
            return (
              <div key={str.id} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-emerald-400">{aud?.name}</span>
                  <span className="text-sm font-medium text-white">{str.title}</span>
                </div>
                <p className="text-xs text-violet-300">{str.postingFrequency}</p>
                <ul className="text-xs text-slate-400 list-disc pl-4 space-y-1">
                  {str.tactics.slice(0, 4).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-400" />
          İçerik takvimi
        </h2>
        <div className="space-y-3">
          {sortedCalendar.map((task) => (
            <div key={task.id} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">{task.date}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                    {CHANNEL_LABELS[task.channel] ?? task.channel}
                  </span>
                  <span className="text-xs text-slate-500">{task.type}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      task.status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : task.status === 'published'
                          ? 'bg-blue-500/15 text-blue-400'
                          : task.status === 'skipped'
                            ? 'bg-slate-600/30 text-slate-400'
                            : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
                <CopyButton text={formatTaskForCopy(task)} />
              </div>
              <p className="text-sm font-medium text-white">{task.title}</p>
              {task.hook && <p className="text-sm text-violet-200 italic">{task.hook}</p>}
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{task.body}</p>
              <p className="text-xs text-emerald-400">{task.cta}</p>
              {task.landingUrl && (
                <code className="text-xs text-slate-500 block break-all">{task.landingUrl}</code>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {(['approved', 'published', 'skipped'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={updatingId === task.id || task.status === status}
                    onClick={() => updateTaskStatus(task.id, status)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                  >
                    {updatingId === task.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : status === 'skipped' ? (
                      <XCircle className="w-3 h-3" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {sortedCalendar.length === 0 && (
            <p className="text-sm text-slate-500">Henüz içerik görevi yok — takvim yenileyin.</p>
          )}
        </div>
      </section>
    </div>
  )
}
