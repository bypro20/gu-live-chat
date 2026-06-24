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
import { PaidMarketingHealthPanel } from '@/components/admin/marketing-health-panel'
import { useToast } from '@/lib/toast'
import { formatAdTaskForCopy } from '@/lib/paid-marketing/format'
import type { AdCampaignTask, AdTaskStatus, PaidMarketingPlan } from '@/lib/paid-marketing/types'

type AutomationConfig = {
  enabled: boolean
  dailyEmailDigest: boolean
  rotateChannels: boolean
  autoLaunchAds: boolean
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
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-white"
      style={{ background: 'var(--admin-accent)' }}
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
      <div className="admin-marketing-subcard space-y-3">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="admin-marketing-channel">
              {CHANNEL_LABELS[task.channel] ?? task.channel}
            </span>
            <span className="text-sm font-medium admin-text">{task.campaignName}</span>
            <span className="text-xs admin-text-muted">{task.date}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full admin-text-secondary border" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-bg-hover)' }}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        <p className="text-xs admin-text-muted">
          Bütçe: ₺{task.dailyBudgetTry}/gün · {task.objective}
        </p>

        <div className="space-y-1">
          <p className="text-xs font-medium admin-text-secondary">Başlıklar</p>
          {task.creative.headlines.map((h) => (
            <p key={h} className="text-sm admin-text">• {h}</p>
          ))}
        </div>

        {task.creative.descriptions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium admin-text-secondary">Açıklamalar</p>
            {task.creative.descriptions.map((d) => (
              <p key={d} className="text-sm admin-text-secondary">• {d}</p>
            ))}
          </div>
        )}

        {task.creative.primaryText && (
          <div className="space-y-1">
            <p className="text-xs font-medium admin-text-secondary">Ana metin</p>
            <p className="text-sm admin-text-secondary whitespace-pre-wrap">{task.creative.primaryText}</p>
          </div>
        )}

        {task.keywords && (
          <p className="text-xs admin-text-muted">
            Anahtar kelimeler: {task.keywords.keywords.join(', ')}
          </p>
        )}

        <p className="text-xs admin-text-secondary">💡 {task.tip}</p>

        <code className="block text-xs admin-text-secondary p-2 rounded-lg overflow-x-auto border" style={{ borderColor: 'var(--admin-border)', background: 'var(--admin-input-bg)' }}>
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
              className="text-xs px-2 py-1 rounded-lg font-semibold text-white disabled:opacity-50"
              style={{ background: '#16a34a' }}
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
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--admin-accent)' }} />
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

      <section className="admin-form-section space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5" style={{ color: 'var(--admin-accent)' }} />
          <h2 className="text-lg font-semibold admin-text">Günlük otomasyon</h2>
        </div>
        <p className="text-sm admin-text-muted">
          Tam otomatik: cron günde 4 kez çalışır, AI metin üretir, Meta reklamlarını oluşturur ve e-posta özeti gönderir.
          {aiAvailable ? ' AI aktif.' : ' AI yok — hazır şablonlar kullanılır.'}
        </p>

        {automation && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: 'enabled' as const, label: 'Otomasyon açık' },
              { key: 'dailyEmailDigest' as const, label: 'Günlük e-posta özeti' },
              { key: 'rotateChannels' as const, label: 'AI ile günlük metin yenile' },
              { key: 'autoLaunchAds' as const, label: 'Meta reklamlarını otomatik oluştur' },
            ].map(({ key, label }) => (
              <label key={key} className="admin-marketing-subcard flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={automation[key]}
                  disabled={savingAutomation}
                  onChange={(e) => saveAutomation({ [key]: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm admin-text">{label}</span>
              </label>
            ))}
            <div className="admin-marketing-subcard">
              <p className="text-xs admin-text-muted mb-1">Bildirim e-postası</p>
              <p className="text-sm admin-text truncate">{automation.notifyEmail || '—'}</p>
            </div>
          </div>
        )}

        {automation?.lastRunSummary && (
          <p className="text-xs admin-text-muted">
            Son çalışma: {automation.lastRunAt ? new Date(automation.lastRunAt).toLocaleString('tr-TR') : '—'} — {automation.lastRunSummary}
          </p>
        )}

        <button
          type="button"
          onClick={runBot}
          disabled={runningBot}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: 'var(--admin-accent)' }}
        >
          {runningBot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Şimdi çalıştır
        </button>

        <PaidMarketingHealthPanel />
      </section>

      <section className="admin-form-section space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" style={{ color: 'var(--admin-accent)' }} />
            <h2 className="text-lg font-semibold admin-text">7 günlük reklam planı</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleGenerate(false)}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--admin-accent)' }}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {aiAvailable ? 'AI ile üret' : 'Planı yenile'}
            </button>
            <button
              type="button"
              onClick={() => handleGenerate(true)}
              disabled={generating}
              className="admin-marketing-btn-secondary"
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
              className="admin-marketing-btn-secondary inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Google Ads CSV
            </button>
          </div>
        </div>
      </section>

      {todayTasks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold admin-text flex items-center gap-2">
            <Target className="w-5 h-5 admin-text-secondary" /> Bugünkü kampanyalar
          </h2>
          {todayTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </section>
      )}

      {plan?.audiences && (
        <section className="admin-form-section space-y-4">
          <h2 className="text-lg font-semibold admin-text">Hedef kitleler</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {plan.audiences.map((aud) => (
              <div key={aud.id} className="admin-marketing-subcard">
                <p className="font-medium admin-text">{aud.name}</p>
                <p className="text-xs admin-text-muted mt-1">{aud.description}</p>
                <p className="text-xs admin-text-secondary mt-2">
                  Kanallar: {aud.channels.map((c) => CHANNEL_LABELS[c] ?? c).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold admin-text">Kampanya takvimi</h2>
        {sortedCalendar.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </section>
    </div>
  )
}
