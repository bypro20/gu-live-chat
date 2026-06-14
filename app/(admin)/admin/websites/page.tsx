'use client'

import { Fragment, useEffect, useState } from 'react'
import {
  Globe, Search, MessageSquare, Users, Calendar, Palette, Code2,
  Copy, Check, ChevronDown, ChevronUp, Activity,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/lib/toast'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

interface TeamMember {
  role: string
  user: { id: string; email: string; name: string | null }
}

interface Website {
  id: string
  name: string
  domain: string
  websiteId: string
  plan: string
  subscriptionStatus: string
  widgetStatus: string
  widgetStatusLabel: string
  embedSnippet: string
  lastActiveAt: string | null
  trialBonusWidgetGranted: boolean
  isTrialActive: boolean
  owner: { id: string; email: string; name: string | null }
  members: TeamMember[]
  _count: { conversations: number; members: number; visitors: number; visitorSessions: number }
  createdAt: string
}

const planBadge: Record<string, string> = {
  FREE: 'bg-white/[0.06] text-gray-400 border-white/[0.06]',
  STARTER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PRO: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  BUSINESS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const widgetBadge: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  INSTALLED: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  INACTIVE: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  NEVER: 'bg-white/5 text-gray-500 border-white/10',
}

export default function AdminWebsitesPage() {
  const { toast } = useToast()
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'NEVER' | 'INACTIVE'>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    async function loadWebsites() {
      try {
        const res = await fetch('/api/admin/websites')
        if (res.ok) {
          setWebsites(await res.json())
        } else {
          const data = await res.json().catch(() => ({}))
          toast({ title: data.error || 'Siteler yüklenemedi', variant: 'error' })
        }
      } catch {
        toast({ title: 'Siteler yüklenemedi', variant: 'error' })
      } finally {
        setLoading(false)
      }
    }
    loadWebsites()
  }, [toast])

  const filteredWebsites = websites.filter((w) => {
    const q = search.toLowerCase()
    const matchSearch =
      w.name.toLowerCase().includes(q) ||
      w.domain.toLowerCase().includes(q) ||
      w.websiteId.toLowerCase().includes(q) ||
      w.owner.email.toLowerCase().includes(q)
    if (!matchSearch) return false
    if (filter === 'ALL') return true
    if (filter === 'ACTIVE') return w.widgetStatus === 'ACTIVE'
    if (filter === 'NEVER') return w.widgetStatus === 'NEVER'
    if (filter === 'INACTIVE') return w.widgetStatus === 'INACTIVE' || w.widgetStatus === 'NEVER'
    return true
  })

  async function changePlan(websiteId: string, newPlan: string) {
    try {
      const res = await fetch(`/api/admin/websites/${websiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      })
      if (res.ok) {
        setWebsites((prev) => prev.map((w) => (w.id === websiteId ? { ...w, plan: newPlan } : w)))
        toast({ title: 'Plan güncellendi', variant: 'success' })
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: data.error || 'Plan güncellenemedi', variant: 'error' })
      }
    } catch {
      toast({ title: 'Plan güncellenemedi', variant: 'error' })
    }
  }

  async function copySnippet(id: string, snippet: string) {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopiedId(id)
      toast({ title: 'Embed kodu kopyalandı', variant: 'success' })
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast({ title: 'Kopyalanamadı', variant: 'error' })
    }
  }

  const activeCount = websites.filter((w) => w.widgetStatus === 'ACTIVE').length

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Site & Widget Yönetimi"
        description={`${websites.length} site · ${activeCount} aktif widget · embed kodu ve kullanım durumu`}
      />

      <div className="mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Site, domain, WEBSITE_ID veya e-posta…"
            className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/50"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="h-11 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white outline-none"
        >
          <option value="ALL" className="bg-[#14142A]">Tüm siteler</option>
          <option value="ACTIVE" className="bg-[#14142A]">Widget aktif</option>
          <option value="NEVER" className="bg-[#14142A]">Widget yok</option>
          <option value="INACTIVE" className="bg-[#14142A]">Pasif / kurulmamış</option>
        </select>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500 text-sm">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Yükleniyor…
          </div>
        ) : filteredWebsites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Globe className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Site bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Site', 'Sahip', 'Widget durumu', 'Plan', 'Aktivite', 'Sohbet', 'Kayıt', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredWebsites.map((website) => (
                  <Fragment key={website.id}>
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0 border border-white/10">
                            {website.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{website.name}</p>
                            <p className="text-xs text-gray-500 truncate">{website.domain}</p>
                            <p className="text-[10px] font-mono text-gray-600 truncate">{website.websiteId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-white truncate">{website.owner?.name || 'İsimsiz'}</p>
                        <p className="text-xs text-gray-500 truncate">{website.owner?.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md border ${widgetBadge[website.widgetStatus] || widgetBadge.NEVER}`}>
                          {website.widgetStatusLabel}
                        </span>
                        {website.trialBonusWidgetGranted && (
                          <p className="text-[10px] text-gray-600 mt-1">init kaydı var</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={website.plan}
                          onChange={(e) => changePlan(website.id, e.target.value)}
                          className={`px-2 py-1.5 text-xs font-semibold rounded-lg border outline-none cursor-pointer ${planBadge[website.plan] || planBadge.FREE}`}
                        >
                          {['FREE', 'STARTER', 'PRO', 'BUSINESS'].map((p) => (
                            <option key={p} value={p} className="bg-[#14142A]">{p}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {website.lastActiveAt
                            ? new Date(website.lastActiveAt).toLocaleString('tr-TR')
                            : '—'}
                        </div>
                        <p className="text-[10px] text-gray-600 mt-0.5">{website._count.visitors} ziyaretçi</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {website._count.conversations}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(website.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expandedId === website.id ? null : website.id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                            title="Embed kodu"
                          >
                            {expandedId === website.id ? <ChevronUp className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
                          </button>
                          <Link
                            href={`/admin/widget?site=${website.id}`}
                            className="p-2 rounded-lg text-primary hover:bg-primary/10"
                            title="Widget ayarları"
                          >
                            <Palette className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                    {expandedId === website.id && (
                      <tr className="bg-white/[0.02]">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid lg:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">Embed kodu (müşterinin sitesine)</p>
                              <pre className="text-[11px] text-gray-300 bg-black/40 rounded-xl p-3 overflow-x-auto border border-white/[0.06] max-h-40">
                                {website.embedSnippet}
                              </pre>
                              <button
                                type="button"
                                onClick={() => copySnippet(website.id, website.embedSnippet)}
                                className="mt-2 inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300"
                              >
                                {copiedId === website.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                Kodu kopyala
                              </button>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" /> Ekip ({website.members.length})
                              </p>
                              <ul className="space-y-1.5 text-sm">
                                {website.members.map((m) => (
                                  <li key={m.user.id} className="flex justify-between text-gray-300">
                                    <span>{m.user.name || m.user.email}</span>
                                    <span className="text-xs text-gray-500">{m.role}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
