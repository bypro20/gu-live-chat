'use client'

import { useState, useEffect, useCallback } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'

interface WebhookEvent {
  id: string
  event: string
}

interface Webhook {
  id: string
  url: string
  isActive: boolean
  secret: string
  events: WebhookEvent[]
  lastTriggeredAt: string | null
  failureCount: number
}

const AVAILABLE_EVENTS = [
  'conversation.created',
  'conversation.resolved',
  'conversation.closed',
  'message.sent',
  'message.received',
  'visitor.created',
  'visitor.updated',
  'team.member.added',
  'team.member.removed',
]

export default function WebhooksPage() {
  const { activeWebsite } = useActiveWebsite()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; text: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchWebhooks = useCallback(async () => {
    if (!activeWebsite) return
    try {
      const res = await fetch(`/api/webhooks?websiteId=${activeWebsite.websiteId}`)
      if (res.ok) setWebhooks(await res.json())
    } catch (err) {
      console.error('Failed to fetch webhooks', err)
    } finally {
      setLoading(false)
    }
  }, [activeWebsite])

  useEffect(() => { fetchWebhooks() }, [fetchWebhooks])

  const handleCreate = async () => {
    if (!activeWebsite) return
    setFormError(null)
    if (!newUrl.trim()) { setFormError('URL gerekli'); return }
    if (selectedEvents.length === 0) { setFormError('En az bir olay seçin'); return }

    setCreating(true)
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: activeWebsite.websiteId,
          url: newUrl.trim(),
          events: selectedEvents,
          isActive: true,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Webhook oluşturulamadı')
      }
      setNewUrl('')
      setSelectedEvents([])
      setShowCreate(false)
      fetchWebhooks()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Webhook oluşturulamadı')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (webhook: Webhook) => {
    setBusyId(webhook.id)
    try {
      await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !webhook.isActive }),
      })
      fetchWebhooks()
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (webhook: Webhook) => {
    if (!confirm('Bu webhook silinsin mi?')) return
    setBusyId(webhook.id)
    try {
      await fetch(`/api/webhooks/${webhook.id}`, { method: 'DELETE' })
      fetchWebhooks()
    } finally {
      setBusyId(null)
    }
  }

  const handleTest = async (webhook: Webhook) => {
    setBusyId(webhook.id)
    setTestResult(null)
    try {
      const res = await fetch(`/api/webhooks/${webhook.id}`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      setTestResult({
        id: webhook.id,
        ok: !!data.success,
        text: data.success
          ? `Test başarılı (HTTP ${data.status})`
          : data.error || 'Test başarısız',
      })
      fetchWebhooks()
    } catch {
      setTestResult({ id: webhook.id, ok: false, text: 'Test isteği gönderilemedi' })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Webhook’lar</h1>
          <p className="text-sm text-muted-foreground mt-1">Dış sistemlere gerçek zamanlı bildirimler gönderin</p>
        </div>
        <button
          onClick={() => { setShowCreate(!showCreate); setFormError(null) }}
          className="btn-primary w-full sm:w-auto"
        >
          + Webhook Ekle
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="surface p-5 sm:p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Yeni Webhook</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">URL</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="https://ornek.com/webhook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Olaylar</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <label key={event} className="flex items-center gap-2 p-2.5 bg-muted rounded-lg cursor-pointer hover:bg-accent transition">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvents([...selectedEvents, event])
                        } else {
                          setSelectedEvents(selectedEvents.filter((ev) => ev !== event))
                        }
                      }}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground font-mono break-all">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
            <button onClick={() => setShowCreate(false)} className="btn-secondary">
              İptal
            </button>
            <button onClick={handleCreate} disabled={creating} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {creating ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </div>
      )}

      {/* Webhook List */}
      <div className="surface">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="p-10 sm:p-12 text-center">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🔗
            </div>
            <h3 className="font-medium text-foreground">Henüz webhook yok</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Webhook ekleyerek dış sistemlere gerçek zamanlı bildirimler gönderin
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm break-all">{webhook.url}</p>
                    <div className="flex items-center flex-wrap gap-2 mt-1.5">
                      {webhook.events.map((event) => (
                        <span key={event.id} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded font-mono">
                          {event.event}
                        </span>
                      ))}
                    </div>
                    {webhook.failureCount > 0 && (
                      <p className="text-xs text-destructive mt-1.5">{webhook.failureCount} başarısız deneme</p>
                    )}
                    {testResult?.id === webhook.id && (
                      <p className={`text-xs mt-1.5 ${testResult.ok ? 'text-success' : 'text-destructive'}`}>{testResult.text}</p>
                    )}
                  </div>
                  <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-full ${webhook.isActive ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'}`}>
                    {webhook.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => handleTest(webhook)}
                    disabled={busyId === webhook.id}
                    className="px-3 py-1.5 text-xs font-medium bg-muted text-foreground rounded-lg hover:bg-accent transition disabled:opacity-50"
                  >
                    Test Et
                  </button>
                  <button
                    onClick={() => handleToggle(webhook)}
                    disabled={busyId === webhook.id}
                    className="px-3 py-1.5 text-xs font-medium bg-muted text-foreground rounded-lg hover:bg-accent transition disabled:opacity-50"
                  >
                    {webhook.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>
                  <button
                    onClick={() => handleDelete(webhook)}
                    disabled={busyId === webhook.id}
                    className="px-3 py-1.5 text-xs font-medium bg-destructive-light text-destructive rounded-lg hover:opacity-80 transition disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 bg-primary-light rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-primary">Webhook güvenliği</p>
          <p className="text-xs text-primary/80 mt-0.5">Her webhook isteği, webhook sırrınız ile imzalanır. İstek doğrulamak için <code className="bg-primary/10 px-1 rounded font-mono">X-Gu-Signature</code> header değerini kullanın.</p>
        </div>
      </div>
    </div>
  )
}
