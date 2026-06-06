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
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ticket Yönetimi</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Müşteri taleplerini yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">{total} ticket</span>
          <Link
            href="/settings/tickets/yeni"
            className="px-4 py-2.5 bg-[#1972F5] hover:bg-[#1565DB] text-white font-medium rounded-xl transition shadow-md shadow-[#1972F5]/30"
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
          className="w-full max-w-md px-4 py-3 border border-[#E5E7EB] dark:border-gray-600 rounded-xl bg-[#EFF6FF] dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#1972F5] focus:border-transparent outline-none transition"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setStatusFilter(null); setPage(1) }}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
            !statusFilter
              ? 'bg-[#1972F5] text-white shadow-md shadow-[#1972F5]/30'
              : 'bg-[#EFF6FF] dark:bg-gray-700 text-[#1E40AF] dark:text-gray-300 hover:bg-[#1972F5]/20'
          }`}
        >
          Tümü
        </button>
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
              statusFilter === s
                ? 'bg-[#1972F5] text-white shadow-md shadow-[#1972F5]/30'
                : 'bg-[#EFF6FF] dark:bg-gray-700 text-[#1E40AF] dark:text-gray-300 hover:bg-[#1972F5]/20'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Ticket Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-[#E5E7EB] dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#1972F5] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[#EFF6FF] dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">Henüz ticket yok</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {statusFilter ? 'Bu durumda ticket bulunamadı' : 'Yeni bir ticket oluşturun'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Konu</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Öncelik</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kanal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Atanan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tarih</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mesaj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-[#EFF6FF] dark:hover:bg-gray-700/50 transition cursor-pointer"
                    onClick={() => window.location.href = `/settings/tickets/${ticket.id}`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                      #{ticket.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.subject}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{ticket.requesterName || ticket.requesterEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-[#EFF6FF] dark:bg-gray-700 text-[#1E40AF] dark:text-gray-300">
                        {STATUS_LABELS[ticket.status] || ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${PRIORITY_CONFIG[ticket.priority]?.color || PRIORITY_CONFIG.MEDIUM.color}`}>
                        {PRIORITY_CONFIG[ticket.priority]?.label || ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {CHANNEL_LABELS[ticket.channel] || ticket.channel}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {ticket.assignedTo ? (
                        <span className="text-gray-900 dark:text-white">{ticket.assignedTo.name || ticket.assignedTo.id.slice(0, 8)}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {timeAgo(ticket.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                      {ticket._count.messages}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm font-medium bg-[#EFF6FF] dark:bg-gray-700 text-[#1E40AF] dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1972F5]/20 transition"
          >
            Önceki
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 text-sm font-medium rounded-lg transition ${
                p === page
                  ? 'bg-[#1972F5] text-white'
                  : 'bg-[#EFF6FF] dark:bg-gray-700 text-[#1E40AF] dark:text-gray-300 hover:bg-[#1972F5]/20'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm font-medium bg-[#EFF6FF] dark:bg-gray-700 text-[#1E40AF] dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1972F5]/20 transition"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  )
}
