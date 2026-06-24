'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Loader2,
  Megaphone,
  Play,
  RefreshCw,
  Target,
  Zap,
} from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { useToast } from '@/lib/toast'
import { formatAdTaskForCopy } from '@/lib/paid-marketing/format'
import type { AdCampaignTask, AdTaskStatus, PaidMarketingPlan } from '@/lib/paid-marketing/types'

type AutomationConfig = {
  enabled: boolean
  dailyEmailDigest: boolean
  rotateChannels: boolean
  notifyEmail: string
  lastRunAt: string | null
  lastRunSummary: string | null
  runCount: number
}

const CHANNEL_LABELS: Record<string, string> = {
  google_search: 'Google Ads',
  meta_feed: 'Meta Feed',
  meta_retarget: 'Meta Retarget',
  linkedin: 'LinkedIn',
}

const STATUS_LABELS: Record<AdTaskStatus, string> = {
  draft: 'Taslak',
  ready: 'Hazır',
  launched: 'Yayında',
  paused: 'Duraklatıldı',
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

export default function AdminPaidMarketingPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState<PaidMarketingPlan | null>(null)
  const [aiAvailable, setAiAvailable] = useState(false)
  const [automation, setAutomation] = useState<AutomationConfig | null>(null)
  const [savingAutomation, setSavingAutomation] = useState(false)
  const [runningBot, setRunningBot] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [planRes, autoRes] = await Promise.all([
        fetch('/api/admin/paid-marketing'),
        fetch('/api/admin/paid-marketing/automation'),
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

  const todayTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return sortedCalendar.filter((t) => t.date === today)
  }, [sortedCalendar])

  const handleGenerate = async (forceSeed = false) => {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/paid-marketing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceSeed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Üretilemedi')
      setPlan(data.plan)
      toast({ title: data.message || 'Plan güncellendi', variant: 'success' })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Hata', variant: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  const saveAutomation = async (patch: Partial<AutomationConfig>) => {
    setSavingAutomation(true)
    try {
      const res = await fetch('/api/admin/paid-marketing/automation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kaydedilemedi')
      setAutomation(data.config)
      toast({ title: 'Ayarlar kaydedildi', variant: 'success' })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Hata', variant: 'error' })
    } finally {
      setSavingAutomation(false)
    }
  }

  const runBot = async () => {
    setRunningBot(true)
    try {
      const res = await fetch('/api/admin/paid-marketing/automation', { method: 'POST' })
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

  const updateTaskStatus = async (taskId: string, status: AdTaskStatus) => {
    setUpdatingId(taskId)
    try {
      const res = await fetch(`/api/admin/paid-marketing/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Güncellenemedi')
      setPlan(data.plan)
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Hata', variant: 'error' })
    } finally {
      setUpdatingId(null)
    }
  }

  function TaskCard({ task }: { task: AdCampaignTask }) {
    return (
      <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
              {CHANNEL_LABELS[task.channel] ?? task.channel}
            </span>
            <span className="text-sm font-medium text-white">{task.campaignName}</span>
            <span className="text-xs text-slate-500">{task.date}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Bütçe: ₺{task.dailyBudgetTry}/gün · {task.objective}
        </p>

        <div className="space-y-1">
          <p className="text-xs text-slate-400 font-medium">Başlıklar</p>
          {task.creative.headlines.map((h) => (
            <p key={h} className="text-sm text-slate-200">• {h}</p>
          ))}
        </div>

        {task.creative.descriptions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">Açıklamalar</p>
            {task.creative.descriptions.map((d) => (
              <p key={d} className="text-sm text-slate-300">• {d}</p>
            ))}
          </div>
        )}

        {task.creative.primaryText && (
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">Ana metin</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{task.creative.primaryText}</p>
          </div>
        )}

        {task.keywords && (
          <p className="text-xs text-slate-500">
            Anahtar kelimeler: {task.keywords.keywords.join(', ')}
          </p>
        )}

        <p className="text-xs text-violet-300">💡 {task.tip}</p>

        <code className="block text-xs text-slate-400 bg-slate-900 p-2 rounded-lg overflow-x-auto">
          {task.landingUrl}
        </code>

        <div className="flex flex-wrap gap-2">
          <CopyButton text={formatAdTaskForCopy(task)} />
          <CopyButton text={task.landingUrl} />
          {task.status !== 'launched' && (
            <button
              type="button"
              disabled={updatingId === task.id}
              onClick={() => updateTaskStatus(task.id, 'launched')}
              className="text-xs px-2 py-1 rounded-lg bg-emerald-600/80 text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Yayına alındı
            </button>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="admin-page flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    )
  }

  return (
    <div className="admin-page max-w-5xl space-y-8 pb-12">
      <div>
        <Link href="/admin/marketing" className="inline-flex items-center gap-1.5 text-sm admin-text-muted hover:admin-text mb-4">
          <ArrowLeft className="w-4 h-4" /> Pazarlama merkezi
        </Link>
        <AdminPageHeader
          title="Ücretli Reklam Otomasyonu"
          description="Google Ads, Meta ve LinkedIn için hazır kampanya metinleri, anahtar kelimeler ve günlük e-posta özeti"
        />
      </div>

      {/* Otomasyon */}
      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Günlük otomasyon</h2>
        </div>
        <p className="text-sm text-slate-400">
          Cron günde 4 kez çalışır: bugünkü kampanyayı hazırlar, AI ile metin yeniler ve e-posta gönderir.
          {aiAvailable ? ' AI aktif.' : ' AI yok — hazır şablonlar kullanılır.'}
        </p>

        {automation && (
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={automation.enabled}
                disabled={savingAutomation}
                onChange={(e) => saveAutomation({ enabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-white">Otomasyon açık</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={automation.dailyEmailDigest}
                disabled={savingAutomation}
                onChange={(e) => saveAutomation({ dailyEmailDigest: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-white">Günlük e-posta özeti</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={automation.rotateChannels}
                disabled={savingAutomation}
                onChange={(e) => saveAutomation({ rotateChannels: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-white">AI ile günlük metin yenile</span>
            </label>
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Bildirim e-postası</p>
              <p className="text-sm text-white truncate">{automation.notifyEmail || '—'}</p>
            </div>
          </div>
        )}

        {automation?.lastRunSummary && (
          <p className="text-xs text-slate-500">
            Son çalışma: {automation.lastRunAt ? new Date(automation.lastRunAt).toLocaleString('tr-TR') : '—'} — {automation.lastRunSummary}
          </p>
        )}

        <button
          type="button"
          onClick={runBot}
          disabled={runningBot}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500 disabled:opacity-50"
        >
          {runningBot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Şimdi çalıştır
        </button>
      </section>

      {/* Plan üret */}
      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">7 günlük reklam planı</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleGenerate(false)}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {aiAvailable ? 'AI ile üret' : 'Planı yenile'}
            </button>
            <button
              type="button"
              onClick={() => handleGenerate(true)}
              disabled={generating}
              className="px-4 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              Hazır şablon
            </button>
            <button
              type="button"
              onClick={async () => {
                const res = await fetch('/api/admin/paid-marketing/export?format=google-keywords')
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'gulivechat-google-ads-keywords.csv'
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-800"
            >
              <Download className="w-4 h-4" /> Google Ads CSV
            </button>
          </div>
        </div>
      </section>

      {/* Bugün */}
      {todayTasks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" /> Bugünkü kampanyalar
          </h2>
          {todayTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </section>
      )}

      {/* Hedef kitleler */}
      {plan?.audiences && (
        <section className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Hedef kitleler</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {plan.audiences.map((aud) => (
              <div key={aud.id} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <p className="font-medium text-white">{aud.name}</p>
                <p className="text-xs text-slate-400 mt-1">{aud.description}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Kanallar: {aud.channels.map((c) => CHANNEL_LABELS[c] ?? c).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Takvim */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Kampanya takvimi</h2>
        {sortedCalendar.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </section>
    </div>
  )
}
