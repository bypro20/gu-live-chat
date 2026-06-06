'use client'

import { useState, useEffect, useCallback } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import Link from 'next/link'

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  channel: string
  requesterName: string | null
  requesterEmail: string
  assignedTo: { id: string; name: string | null; image: string | null } | null
  createdAt: string
  _count: { messages: number }
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

const STATUS_TABS = ['NEW', 'OPEN', 'PENDING_CUSTOMER', 'PENDING_AGENT', 'ON_HOLD', 'RESOLVED', 'CLOSED']

export default function TicketsPage() {
  const { activeWebsite } = useActiveWebsite()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchTickets = useCallback(async () => {
    if (!activeWebsite?.websiteId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ websiteId: activeWebsite.id, page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/tickets?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [activeWebsite?.websiteId, activeWebsite?.id, statusFilter, search, page])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const timeAgo = (date: string) => {
    const now = new Date()
    const d = new Date(date)
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'şimdi'
    if (diff < 3600) return `${Math.floor(diff / 60)}dk`
    if (diff < 86400) return `${Math.floor(diff / 3600)}sa`
    return `${Math.floor(diff / 86400)}g`
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Ticket Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-1">Müşteri taleplerini yönetin</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-sm text-muted-foreground">{total} ticket</span>
          <Link
            href="/settings/tickets/yeni"
            className="btn-primary"
          >
            + Ticket Oluştur
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Ticket ara (konu, e-posta, isim)..."
          className="w-full sm:max-w-md px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-nowrap sm:flex-wrap gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => { setStatusFilter(null); setPage(1) }}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition whitespace-nowrap shrink-0 ${
            !statusFilter
              ? 'bg-primary text-primary-foreground shadow-brand'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          Tümü
        </button>
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition whitespace-nowrap shrink-0 ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground shadow-brand'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Ticket Table */}
      <div className="surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-10 sm:p-12 text-center">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-foreground">Henüz ticket yok</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter ? 'Bu durumda ticket bulunamadı' : 'Yeni bir ticket oluşturun'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Konu</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Durum</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Öncelik</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Kanal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Atanan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tarih</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Mesaj</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-muted transition cursor-pointer"
                      onClick={() => window.location.href = `/settings/tickets/${ticket.id}`}
                    >
                      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                        #{ticket.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground">{ticket.requesterName || ticket.requesterEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-foreground">
                          {STATUS_LABELS[ticket.status] || ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${PRIORITY_CONFIG[ticket.priority]?.color || PRIORITY_CONFIG.MEDIUM.color}`}>
                          {PRIORITY_CONFIG[ticket.priority]?.label || ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {CHANNEL_LABELS[ticket.channel] || ticket.channel}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {ticket.assignedTo ? (
                          <span className="text-foreground">{ticket.assignedTo.name || ticket.assignedTo.id.slice(0, 8)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {timeAgo(ticket.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {ticket._count.messages}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => window.location.href = `/settings/tickets/${ticket.id}`}
                  className="w-full text-left p-4 hover:bg-muted transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground min-w-0 break-words">{ticket.subject}</p>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">#{ticket.id.slice(0, 8)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{ticket.requesterName || ticket.requesterEmail}</p>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-foreground">
                      {STATUS_LABELS[ticket.status] || ticket.status}
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${PRIORITY_CONFIG[ticket.priority]?.color || PRIORITY_CONFIG.MEDIUM.color}`}>
                      {PRIORITY_CONFIG[ticket.priority]?.label || ticket.priority}
                    </span>
                    <span className="text-xs text-muted-foreground">{CHANNEL_LABELS[ticket.channel] || ticket.channel}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{timeAgo(ticket.createdAt)} · {ticket._count.messages} mesaj</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center flex-wrap gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm font-medium bg-muted text-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition"
          >
            Önceki
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 text-sm font-medium rounded-lg transition ${
                p === page
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-accent'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm font-medium bg-muted text-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  )
}
