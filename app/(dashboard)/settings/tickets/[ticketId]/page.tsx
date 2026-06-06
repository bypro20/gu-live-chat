'use client'

import { useState, useEffect, useCallback } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { useParams, useRouter } from 'next/navigation'

interface TicketMessage {
  id: string
  content: string
  senderType: string
  isInternal: boolean
  sender: { id: string; name: string | null; image: string | null } | null
  attachments: { id: string; url: string; fileName: string }[]
  createdAt: string
}

interface TicketDetail {
  id: string
  subject: string
  status: string
  priority: string
  channel: string
  requesterName: string | null
  requesterEmail: string
  description: string | null
  assignedTo: { id: string; name: string | null; image: string | null } | null
  tags: { id: string; tag: { id: string; name: string; color: string } }[]
  firstResponseAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  createdAt: string
}

interface TeamMember {
  id: string
  role: string
  user: { id: string; name: string | null; email: string; image: string | null }
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Yeni',
  OPEN: 'Açık',
  PENDING_CUSTOMER: 'Müşteri Bekliyor',
  PENDING_AGENT: 'Temsilci Bekliyor',
  ON_HOLD: 'Beklemede',
  RESOLVED: 'Çözüldü',
  CLOSED: 'Kapalı',
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Düşük', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  MEDIUM: { label: 'Orta', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  HIGH: { label: 'Yüksek', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  URGENT: { label: 'Acil', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: 'E-posta',
  WIDGET: 'Widget',
  API: 'API',
  WHATSAPP: 'WhatsApp',
  MESSENGER: 'Messenger',
  INSTAGRAM: 'Instagram',
  IMPORT: 'İçe Aktarma',
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { activeWebsite } = useActiveWebsite()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [showInternal, setShowInternal] = useState(false)

  const ticketId = params?.ticketId as string

  const fetchData = useCallback(async () => {
    if (!ticketId || !activeWebsite?.websiteId) return
    setLoading(true)
    try {
      const [ticketRes, messagesRes, membersRes] = await Promise.all([
        fetch(`/api/tickets?websiteId=${activeWebsite.id}`),
        fetch(`/api/tickets/${ticketId}/messages`),
        fetch(`/api/team?websiteId=${activeWebsite.id}`),
      ])
      if (ticketRes.ok) {
        const data = await ticketRes.json()
        const found = data.tickets.find((t: TicketDetail) => t.id === ticketId)
        if (found) {
          setTicket(found)
          setStatus(found.status)
          setPriority(found.priority)
          setAssignedToId(found.assignedTo?.id || '')
        }
      }
      if (messagesRes.ok) {
        setMessages(await messagesRes.json())
      }
      if (membersRes.ok) {
        setTeamMembers(await membersRes.json())
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [ticketId, activeWebsite?.websiteId, activeWebsite?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSendReply = async () => {
    if (!reply.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply.trim(), isInternal }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages((prev) => [...prev, msg])
        setReply('')
        if (ticket && ticket.status === 'NEW') {
          setTicket({ ...ticket, status: 'OPEN', firstResponseAt: new Date().toISOString() })
          setStatus('OPEN')
        }
      }
    } catch {
      // silently fail
    } finally {
      setSending(false)
    }
  }

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!ticket) return
    try {
      const res = await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticket.id, ...data }),
      })
      if (res.ok) {
        const updated = await res.json()
        setTicket((prev) => prev ? { ...prev, ...updated } : prev)
      }
    } catch {
      // silently fail
    }
  }

  const timeAgo = (date: string) => {
    const now = new Date()
    const d = new Date(date)
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'şimdi'
    if (diff < 3600) return `${Math.floor(diff / 60)}dk`
    if (diff < 86400) return `${Math.floor(diff / 3600)}sa`
    return `${Math.floor(diff / 86400)}g`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <h2 className="text-lg font-medium text-foreground">Ticket bulunamadı</h2>
        <button onClick={() => router.back()} className="mt-4 text-primary hover:underline text-sm">
          Geri dön
        </button>
      </div>
    )
  }

  const publicMessages = messages.filter((m) => !m.isInternal)
  const internalMessages = messages.filter((m) => m.isInternal)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => router.push('/settings/tickets')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Ticketlere Dön
      </button>

      {/* Header */}
      <div className="surface p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-foreground break-words">{ticket.subject}</h1>
            <p className="text-sm text-muted-foreground mt-1 break-words">
              #{ticket.id.slice(0, 8)} &middot; {ticket.requesterName || ticket.requesterEmail} &middot; {CHANNEL_LABELS[ticket.channel] || ticket.channel}
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${PRIORITY_CONFIG[ticket.priority]?.color || PRIORITY_CONFIG.MEDIUM.color}`}>
              {PRIORITY_CONFIG[ticket.priority]?.label || ticket.priority}
            </span>
            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted text-foreground">
              {STATUS_LABELS[ticket.status] || ticket.status}
            </span>
          </div>
        </div>

        {ticket.description && (
          <p className="text-sm text-foreground mb-4 p-4 bg-muted rounded-xl whitespace-pre-wrap">
            {ticket.description}
          </p>
        )}

        <div className="text-xs text-muted-foreground">
          Oluşturulma: {formatDate(ticket.createdAt)}
          {ticket.firstResponseAt && <> &middot; İlk yanıt: {formatDate(ticket.firstResponseAt)}</>}
          {ticket.resolvedAt && <> &middot; Çözüm: {formatDate(ticket.resolvedAt)}</>}
          {ticket.closedAt && <> &middot; Kapanış: {formatDate(ticket.closedAt)}</>}
        </div>
      </div>

      {/* Actions Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Durum</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); handleUpdate({ status: e.target.value }) }}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          >
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Öncelik</label>
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); handleUpdate({ priority: e.target.value }) }}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          >
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Atanan Temsilci</label>
          <select
            value={assignedToId}
            onChange={(e) => { setAssignedToId(e.target.value); handleUpdate({ assignedToId: e.target.value || null }) }}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          >
            <option value="">Atanmamış</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.user.id}>
                {member.user.name || member.user.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Message Thread */}
      <div className="surface mb-6">
        <div className="p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Mesajlar</h2>

          {publicMessages.length === 0 && !showInternal && (
            <p className="text-sm text-muted-foreground text-center py-8">Henüz mesaj yok</p>
          )}

          <div className="space-y-4">
            {publicMessages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {msg.sender?.name?.[0]?.toUpperCase() || msg.sender?.id?.[0]?.toUpperCase() || 'T'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {msg.sender?.name || 'Temsilci'}
                    </span>
                    <span className="text-xs text-muted-foreground">{timeAgo(msg.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">{msg.content}</p>
                  {msg.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-muted rounded-lg text-xs text-primary hover:underline"
                        >
                          {att.fileName}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Internal Notes Toggle */}
          {internalMessages.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowInternal(!showInternal)}
                className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 hover:underline"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={showInternal ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'} />
                </svg>
                {internalMessages.length} iç not
              </button>

              {showInternal && (
                <div className="mt-4 space-y-4">
                  {internalMessages.map((msg) => (
                    <div key={msg.id} className="flex gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-900/30">
                      <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-700 dark:text-yellow-400 text-xs font-bold shrink-0">
                        {msg.sender?.name?.[0]?.toUpperCase() || 'N'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                            {msg.sender?.name || 'Not'} <span className="text-xs text-yellow-600 dark:text-yellow-500 font-normal">(iç not)</span>
                          </span>
                          <span className="text-xs text-yellow-600 dark:text-yellow-500">{timeAgo(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reply Input */}
        <div className="border-t border-border p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setIsInternal(false)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                !isInternal
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              Yanıtla
            </button>
            <button
              onClick={() => setIsInternal(true)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                isInternal
                  ? 'bg-yellow-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              İç Not
            </button>
          </div>
          <div className="flex gap-3">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  handleSendReply()
                }
              }}
              placeholder={isInternal ? 'İç not ekleyin...' : 'Yanıtınızı yazın...'}
              rows={3}
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
            <span className="text-xs text-muted-foreground">
              {isInternal ? 'Sadece temsilciler görebilir' : 'Müşteriye gönderilecek'} &middot; Cmd/Ctrl+Enter
            </span>
            <button
              onClick={handleSendReply}
              disabled={!reply.trim() || sending}
              className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Gönderiliyor...' : isInternal ? 'Not Ekle' : 'Gönder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
