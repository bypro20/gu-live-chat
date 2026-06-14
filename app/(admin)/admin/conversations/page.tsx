'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Search, Globe, User, ExternalLink } from 'lucide-react'
import { useToast } from '@/lib/toast'

type Conversation = {
  id: string
  status: string
  source: string | null
  lastMessageAt: string | null
  lastMessagePreview: string | null
  unreadCount: number
  createdAt: string
  website: {
    id: string
    name: string
    domain: string
    websiteId: string
    plan: string
    owner: { email: string; name: string | null }
  }
  visitor: {
    id: string
    name: string | null
    email: string | null
    country: string | null
    city: string | null
  } | null
  _count: { messages: number }
}

export default function AdminConversationsPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async (q?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q?.trim()) params.set('search', q.trim())
      params.set('limit', '100')
      const res = await fetch(`/api/admin/conversations?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setItems(data.conversations || [])
    } catch {
      toast({ title: 'Sohbetler yüklenemedi', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-violet-400" />
          Tüm Sohbetler
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Platform genelinde tüm müşteri sitelerindeki konuşmalar — hangi kullanıcı, hangi site
        </p>
      </div>

      <form
        className="mb-5 flex gap-2 max-w-xl"
        onSubmit={(e) => {
          e.preventDefault()
          load(search)
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Site, e-posta, mesaj ara…"
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm outline-none focus:border-violet-500/50"
          />
        </div>
        <button type="submit" className="px-4 h-11 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium">
          Ara
        </button>
      </form>

      <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-white/[0.02]">
        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm">Yükleniyor…</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">Sohbet bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-gray-500 uppercase text-left">
                  {['Site', 'Site sahibi', 'Ziyaretçi', 'Son mesaj', 'Durum', 'Mesaj', 'Tarih'].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{c.website.name}</p>
                      <p className="text-xs text-gray-500">{c.website.domain}</p>
                      <p className="text-[10px] font-mono text-gray-600">{c.website.websiteId}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-[160px] truncate">
                      {c.website.owner.email}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white">{c.visitor?.name || 'Anonim'}</p>
                      <p className="text-xs text-gray-500">{c.visitor?.email || '—'}</p>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-gray-300 truncate">{c.lastMessagePreview || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-md bg-white/5 text-gray-400">{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 tabular-nums">{c._count.messages}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {c.lastMessageAt
                        ? new Date(c.lastMessageAt).toLocaleString('tr-TR')
                        : new Date(c.createdAt).toLocaleString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 mt-4 flex items-center gap-2">
        <User className="w-3.5 h-3.5" />
        Detaylı yanıt için müşteri panelinde site seçin veya
        <Link href="/admin/inbox" className="text-violet-400 hover:underline inline-flex items-center gap-1">
          pazarlama gelen kutusu <ExternalLink className="w-3 h-3" />
        </Link>
      </p>
    </div>
  )
}
