'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Archive,
  ArrowLeft,
  Loader2,
  Mail,
  MailOpen,
  RefreshCw,
  Reply,
  Search,
  Star,
  StarOff,
  Inbox,
} from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { useToast } from '@/lib/toast'
import { ADMIN_MAIL_SOURCE_LABELS, type AdminMailMessage, type AdminMailSource } from '@/lib/admin-mail-types'
import { cn } from '@/lib/utils'

type FilterStatus = 'all' | 'unread' | 'read' | 'archived'
type FilterSource = 'all' | AdminMailSource

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminMailPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<AdminMailMessage[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [sourceFilter, setSourceFilter] = useState<FilterSource>('all')
  const [search, setSearch] = useState('')
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [updating, setUpdating] = useState(false)

  const selected = useMemo(
    () => messages.find((m) => m.id === selectedId) ?? null,
    [messages, selectedId]
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (sourceFilter !== 'all') params.set('source', sourceFilter)
      if (search.trim()) params.set('q', search.trim())
      const res = await fetch(`/api/admin/mail?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Yüklenemedi')
      setMessages(data.messages ?? [])
      if (selectedId && !data.messages?.some((m: AdminMailMessage) => m.id === selectedId)) {
        setSelectedId(data.messages?.[0]?.id ?? null)
      } else if (!selectedId && data.messages?.[0]) {
        setSelectedId(data.messages[0].id)
      }
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Hata', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, sourceFilter, search, selectedId, toast])

  useEffect(() => {
    load()
  }, [load])

  const openMessage = async (id: string) => {
    setSelectedId(id)
    const msg = messages.find((m) => m.id === id)
    if (msg?.status === 'unread') {
      try {
        const res = await fetch(`/api/admin/mail/${id}`)
        const data = await res.json()
        if (res.ok && data.message) {
          setMessages((prev) => prev.map((m) => (m.id === id ? data.message : m)))
        }
      } catch {
        /* ignore */
      }
    }
  }

  const patchMessage = async (id: string, patch: { status?: string; starred?: boolean }) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/mail/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Güncellenemedi')
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...data.message } : m)))
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Hata', variant: 'error' })
    } finally {
      setUpdating(false)
    }
  }

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return
    setReplying(true)
    try {
      const res = await fetch(`/api/admin/mail/${selected.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyText.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Yanıt gönderilemedi')
      setMessages((prev) => prev.map((m) => (m.id === selected.id ? data.message : m)))
      setReplyText('')
      toast({
        title: data.emailed ? 'Yanıt gönderildi' : 'Yanıt kaydedildi',
        description: data.note,
        variant: 'success',
      })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Hata', variant: 'error' })
    } finally {
      setReplying(false)
    }
  }

  const unreadCount = messages.filter((m) => m.status === 'unread').length

  return (
    <div className="admin-page h-full min-h-0 flex flex-col pb-4">
      <div className="shrink-0 mb-4">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm admin-text-muted hover:admin-text mb-3">
          <ArrowLeft className="w-4 h-4" /> Admin paneli
        </Link>
        <AdminPageHeader
          title="E-posta Merkezi"
          description="İletişim formu, pazarlama botu ve kullanıcı mesajları — tek panelden okuyun ve yanıtlayın"
        />
      </div>

      <div className="admin-mail-shell">
        {/* Liste */}
        <div className="admin-mail-list-pane">
          <div className="p-3 space-y-2 border-b shrink-0" style={{ borderColor: 'var(--admin-border)' }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 admin-text-muted pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara..."
                className="admin-input w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/25"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {(['all', 'unread', 'read', 'archived'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn('admin-filter-chip', statusFilter === s && 'admin-filter-chip--active')}
                >
                  {s === 'all' ? 'Tümü' : s === 'unread' ? `Okunmamış${unreadCount ? ` (${unreadCount})` : ''}` : s === 'read' ? 'Okundu' : 'Arşiv'}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {(['all', 'contact-form', 'organic-marketing', 'system'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSourceFilter(s)}
                  className={cn('admin-filter-chip', sourceFilter === s && 'admin-filter-chip--active')}
                >
                  {s === 'all' ? 'Tüm kaynaklar' : ADMIN_MAIL_SOURCE_LABELS[s]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => load()}
              className="inline-flex items-center gap-1 text-xs admin-text-muted hover:admin-text transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Yenile
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--admin-accent)' }} />
              </div>
            ) : messages.length === 0 ? (
              <div className="p-6 text-center text-sm admin-text-muted">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Henüz mail yok
              </div>
            ) : (
              messages.map((msg) => (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => openMessage(msg.id)}
                  className={cn(
                    'admin-mail-row',
                    selectedId === msg.id && 'admin-mail-row--selected',
                    msg.status === 'unread' && selectedId !== msg.id && 'admin-mail-row--unread'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn('text-sm truncate', msg.status === 'unread' && 'font-semibold admin-text')}>
                      {msg.fromName || msg.fromEmail || 'Sistem'}
                    </span>
                    {msg.starred && <Star className="w-3 h-3 text-amber-500 shrink-0 fill-amber-500" />}
                  </div>
                  <p className={cn('text-xs truncate mt-0.5 admin-text-secondary')}>{msg.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="admin-badge-muted text-[10px] px-1.5 py-0.5 rounded border">
                      {ADMIN_MAIL_SOURCE_LABELS[msg.source]}
                    </span>
                    <span className="text-[10px] admin-text-faint">{formatDate(msg.createdAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detay */}
        <div className="admin-mail-detail-pane min-h-[320px] lg:min-h-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center admin-text-muted text-sm">
              <Mail className="w-10 h-10 mb-2 opacity-30" />
              <span className="ml-2">Okumak için bir mail seçin</span>
            </div>
          ) : (
            <>
              <div className="p-4 border-b shrink-0 space-y-2" style={{ borderColor: 'var(--admin-border)' }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold admin-text">{selected.subject}</h2>
                    <p className="text-sm admin-text-muted mt-1">
                      {selected.fromName && <span>{selected.fromName} · </span>}
                      {selected.fromEmail ? (
                        <a href={`mailto:${selected.fromEmail}`} className="admin-text-link">
                          {selected.fromEmail}
                        </a>
                      ) : (
                        <span>Sistem mesajı</span>
                      )}
                    </p>
                    <p className="text-xs admin-text-faint mt-1">{formatDate(selected.createdAt)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => patchMessage(selected.id, { starred: !selected.starred })}
                      className="admin-btn-icon"
                      title="Yıldızla"
                    >
                      {selected.starred ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                    </button>
                    {selected.status !== 'archived' ? (
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => patchMessage(selected.id, { status: 'archived' })}
                        className="admin-btn-icon"
                        title="Arşivle"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => patchMessage(selected.id, { status: 'read' })}
                        className="admin-btn-icon"
                        title="Arşivden çıkar"
                      >
                        <MailOpen className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <pre className="text-sm admin-text-secondary whitespace-pre-wrap font-sans leading-relaxed">
                  {selected.body}
                </pre>
                {typeof selected.metadata?.landingUrl === 'string' && (
                  <a
                    href={selected.metadata.landingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 text-sm admin-text-link"
                  >
                    {selected.metadata.landingUrl}
                  </a>
                )}
                {selected.replyBody && (
                  <div className="admin-mail-reply-box">
                    <p className="text-xs admin-accent-label mb-1">
                      Gönderilen yanıt · {selected.repliedAt ? formatDate(selected.repliedAt) : ''}
                    </p>
                    <pre className="text-sm admin-text-secondary whitespace-pre-wrap font-sans">{selected.replyBody}</pre>
                  </div>
                )}
              </div>

              {selected.fromEmail && (
                <div className="p-4 border-t shrink-0 space-y-2" style={{ borderColor: 'var(--admin-border)' }}>
                  <label className="text-xs admin-text-muted flex items-center gap-1">
                    <Reply className="w-3 h-3" /> Yanıt ({selected.fromEmail})
                  </label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={4}
                    placeholder="Yanıtınızı yazın..."
                    className="admin-input admin-form-textarea w-full rounded-xl border p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/25"
                  />
                  <button
                    type="button"
                    disabled={replying || !replyText.trim()}
                    onClick={handleReply}
                    className="admin-btn-primary"
                  >
                    {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Reply className="w-4 h-4" />}
                    Yanıt gönder
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
