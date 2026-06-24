'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, Loader2, Mail, Webhook } from 'lucide-react'
import { useToast } from '@/lib/toast'

type OrganicHealth = {
  email: { providerConfigured: boolean; deliverToOk: boolean; note: string }
  webhook: { configured: boolean; isInternalDispatch: boolean; note: string }
  cron: { secretConfigured: boolean; scheduleTr: string }
  inbox: { recentCount: number; latestSubject: string | null; latestAt: string | null }
  autoPublish?: {
    enabled: boolean
    facebook: boolean
    instagram: boolean
    linkedin: boolean
    x: boolean
    note: string
  }
}

type PaidHealth = {
  email: { providerConfigured: boolean; deliverToOk: boolean; note: string }
  cron: { secretConfigured: boolean; scheduleTr: string }
  campaigns: { todayCount: number; channels: string[] }
  autoLaunch?: { enabled: boolean; metaReady: boolean; note: string }
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: ok ? '#22c55e' : '#ef4444' }}
    />
  )
}

export function OrganicMarketingHealthPanel() {
  const { toast } = useToast()
  const [health, setHealth] = useState<OrganicHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/organic-marketing/health')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Yüklenemedi')
      setHealth(data.health)
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Durum okunamadı', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const runTest = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/admin/organic-marketing/health', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Test başarısız')
      setHealth(data.health)
      const hint = data.test?.hint || data.test?.dispatch?.error || 'Test tamamlandı'
      toast({
        title: data.test?.dispatch?.ok ? 'Test gönderildi' : 'Test uyarısı',
        description: hint,
        variant: data.test?.dispatch?.ok ? 'success' : 'error',
      })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Test başarısız', variant: 'error' })
    } finally {
      setTesting(false)
    }
  }

  if (loading && !health) {
    return (
      <div className="flex items-center gap-2 text-xs admin-text-muted py-2">
        <Loader2 className="w-3 h-3 animate-spin" /> Bağlantı durumu kontrol ediliyor…
      </div>
    )
  }

  if (!health) return null

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
        <Activity className="w-4 h-4" />
        Bağlantı durumu
      </div>
      <ul className="space-y-2 text-xs text-slate-400">
        <li className="flex items-start gap-2">
          <StatusDot ok={health.cron.secretConfigured} />
          <span>Cron: {health.cron.secretConfigured ? `aktif (${health.cron.scheduleTr} TR)` : 'CRON_SECRET yok'}</span>
        </li>
        <li className="flex items-start gap-2">
          <Webhook className="w-3 h-3 mt-0.5 shrink-0 text-slate-500" />
          <StatusDot ok={health.webhook.configured} />
          <span>{health.webhook.note}</span>
        </li>
        <li className="flex items-start gap-2">
          <Mail className="w-3 h-3 mt-0.5 shrink-0 text-slate-500" />
          <StatusDot ok={health.email.providerConfigured && (health.email.deliverToOk || health.webhook.isInternalDispatch)} />
          <span>{health.email.note}</span>
        </li>
        {health.inbox.latestSubject && (
          <li className="text-slate-500 pl-4">
            Son kutu kaydı: {health.inbox.latestSubject}
            {health.inbox.latestAt ? ` (${new Date(health.inbox.latestAt).toLocaleString('tr-TR')})` : ''}
          </li>
        )}
        {health.autoPublish && (
          <li className="flex items-start gap-2">
            <StatusDot ok={health.autoPublish.enabled && (health.autoPublish.instagram || health.autoPublish.linkedin || health.autoPublish.facebook)} />
            <span>
              {health.autoPublish.note}
              {health.autoPublish.instagram ? ' · IG' : ''}
              {health.autoPublish.linkedin ? ' · LinkedIn' : ''}
              {health.autoPublish.x ? ' · X' : ''}
            </span>
          </li>
        )}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runTest}
          disabled={testing}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {testing ? 'Gönderiliyor…' : 'Test gönder'}
        </button>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
        >
          Yenile
        </button>
        <a href="/admin/mail?source=organic-marketing" className="px-3 py-1.5 rounded-lg text-xs text-emerald-400 hover:underline">
          E-posta Merkezi →
        </a>
      </div>
    </div>
  )
}

export function PaidMarketingHealthPanel() {
  const { toast } = useToast()
  const [health, setHealth] = useState<PaidHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/paid-marketing/health')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Yüklenemedi')
      setHealth(data.health)
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Durum okunamadı', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const runTest = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/admin/paid-marketing/health', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Test başarısız')
      setHealth(data.health)
      toast({
        title: data.test?.ok ? 'Test e-postası gönderildi' : 'E-posta gönderilemedi',
        description: data.test?.hint || data.test?.error,
        variant: data.test?.ok ? 'success' : 'error',
      })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Test başarısız', variant: 'error' })
    } finally {
      setTesting(false)
    }
  }

  if (loading && !health) {
    return (
      <div className="flex items-center gap-2 text-xs admin-text-muted py-2">
        <Loader2 className="w-3 h-3 animate-spin" /> E-posta durumu kontrol ediliyor…
      </div>
    )
  }

  if (!health) return null

  return (
    <div className="admin-marketing-subcard space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium admin-text">
        <Activity className="w-4 h-4" style={{ color: 'var(--admin-accent)' }} />
        E-posta & cron durumu
      </div>
      <ul className="space-y-2 text-xs admin-text-muted">
        <li className="flex items-start gap-2">
          <StatusDot ok={health.cron.secretConfigured} />
          <span>Cron: {health.cron.secretConfigured ? `aktif (${health.cron.scheduleTr} TR)` : 'CRON_SECRET yok'}</span>
        </li>
        <li className="flex items-start gap-2">
          <Mail className="w-3 h-3 mt-0.5 shrink-0" />
          <StatusDot ok={health.email.providerConfigured && health.email.deliverToOk} />
          <span>{health.email.note}</span>
        </li>
        <li className="pl-4">
          Bugün {health.campaigns.todayCount} kampanya
          {health.campaigns.channels.length ? ` (${health.campaigns.channels.join(', ')})` : ''}
        </li>
        {health.autoLaunch && (
          <li className="flex items-start gap-2">
            <StatusDot ok={health.autoLaunch.enabled && health.autoLaunch.metaReady} />
            <span>{health.autoLaunch.note}</span>
          </li>
        )}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runTest}
          disabled={testing}
          className="admin-marketing-btn-secondary px-3 py-1.5 text-xs disabled:opacity-50"
        >
          {testing ? 'Gönderiliyor…' : 'Özet e-postası test et'}
        </button>
        <button type="button" onClick={load} disabled={loading} className="px-3 py-1.5 text-xs admin-text-muted hover:admin-text">
          Yenile
        </button>
      </div>
    </div>
  )
}
