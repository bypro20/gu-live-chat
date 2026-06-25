'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import {
  Globe, Search, MessageSquare, Users, Calendar, Palette, Code2,
  Copy, Check, ChevronDown, ChevronUp, Activity, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/lib/toast'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'
import type { AdminPaginatedResult } from '@/lib/admin-list-query'

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
  FREE: 'admin-badge-muted',
  STARTER: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  PRO: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  BUSINESS: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
}

const widgetBadge: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  INSTALLED: 'bg-sky-500/15 text-sky-600 border-sky-500/30',
  INACTIVE: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  NEVER: 'admin-badge-muted border',
}

export default function AdminWebsitesPage() {
  const { toast } = useToast()
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'NEVER' | 'INACTIVE'>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadWebsites = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (filter !== 'ALL') params.set('widgetStatus', filter)

      const res = await fetch(`/api/admin/websites?${params}`)
      if (res.ok) {
        const data = (await res.json()) as AdminPaginatedResult<Website>
        setWebsites(data.items)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setPage(data.page)
      } else {
        const body = await res.json().catch(() => ({}))
        toast({ title: body.error || 'Siteler yüklenemedi', variant: 'error' })
      }
    } catch {
      toast({ title: 'Siteler yüklenemedi', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, filter, page, pageSize, toast])

  useEffect(() => {
    void loadWebsites()
  }, [loadWebsites])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filter, pageSize])

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

  const activeOnPage = websites.filter((w) => w.widgetStatus === 'ACTIVE').length

  return (
    <div className="admin-page">
      <AdminPageHeader
        title="Site & Widget Yönetimi"
        description={`${total.toLocaleString('tr-TR')} site · bu sayfada ${activeOnPage} aktif widget`}
      />

      <div className="mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 admin-text-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Site, domain, WEBSITE_ID veya e-posta…"
            className="admin-input w-full h-11 rounded-xl pl-10 pr-4 text-sm"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="admin-input h-11 px-3 rounded-xl text-sm min-w-[10rem]"
        >
          <option value="ALL">Tüm siteler</option>
          <option value="ACTIVE">Widget aktif</option>
          <option value="NEVER">Widget yok</option>
          <option value="INACTIVE">Pasif / kurulmamış</option>
        </select>
      </div>

      <div className="admin-table-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 admin-text-muted text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            Yükleniyor…
          </div>
        ) : websites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 admin-text-muted">
            <Globe className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Site bulunamadı</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] admin-table">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--admin-border)' }}>
                    {['Site', 'Sahip', 'Widget durumu', 'Plan', 'Aktivite', 'Sohbet', 'Kayıt', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold admin-text-muted uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {websites.map((website) => (
                    <Fragment key={website.id}>
                      <tr className="admin-table-row">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 border admin-text-accent" style={{ background: 'var(--admin-accent-soft)', borderColor: 'var(--admin-accent-border)' }}>
                              {website.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium admin-text truncate">{website.name}</p>
                              <p className="text-xs admin-text-muted truncate">{website.domain}</p>
                              <p className="text-[10px] font-mono admin-text-faint truncate">{website.websiteId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm admin-text truncate">{website.owner?.name || 'İsimsiz'}</p>
                          <p className="text-xs admin-text-muted truncate">{website.owner?.email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex text-[10px] font-bold px-2 py-1 rounded-md border ${widgetBadge[website.widgetStatus] || widgetBadge.NEVER}`}>
                            {website.widgetStatusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={website.plan}
                            onChange={(e) => changePlan(website.id, e.target.value)}
                            className={`px-2 py-1.5 text-xs font-semibold rounded-lg border outline-none cursor-pointer admin-input ${planBadge[website.plan] || planBadge.FREE}`}
                          >
                            {['FREE', 'STARTER', 'PRO', 'BUSINESS'].map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-4 text-xs admin-text-muted whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {website.lastActiveAt
                              ? new Date(website.lastActiveAt).toLocaleString('tr-TR')
                              : '—'}
                          </div>
                          <p className="text-[10px] admin-text-faint mt-0.5">{website._count.visitors} ziyaretçi</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-sm admin-text-muted">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {website._count.conversations}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-xs admin-text-muted whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(website.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setExpandedId(expandedId === website.id ? null : website.id)}
                              className="admin-btn-icon p-2"
                              title="Embed kodu"
                            >
                              {expandedId === website.id ? <ChevronUp className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
                            </button>
                            <Link
                              href={`/admin/widget?site=${website.id}`}
                              className="admin-btn-icon p-2 admin-text-accent"
                              title="Widget ayarları"
                            >
                              <Palette className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                      {expandedId === website.id && (
                        <tr>
                          <td colSpan={8} className="px-4 py-4" style={{ background: 'var(--admin-bg-subtle)' }}>
                            <div className="grid lg:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-semibold admin-text-muted mb-2 uppercase">Embed kodu</p>
                                <pre className="text-[11px] admin-text-secondary rounded-xl p-3 overflow-x-auto border max-h-40" style={{ background: 'var(--admin-bg-card)', borderColor: 'var(--admin-border)' }}>
                                  {website.embedSnippet}
                                </pre>
                                <button
                                  type="button"
                                  onClick={() => copySnippet(website.id, website.embedSnippet)}
                                  className="mt-2 inline-flex items-center gap-1.5 text-xs admin-text-link"
                                >
                                  {copiedId === website.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  Kodu kopyala
                                </button>
                              </div>
                              <div>
                                <p className="text-xs font-semibold admin-text-muted mb-2 uppercase flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" /> Ekip ({website.members.length})
                                </p>
                                <ul className="space-y-1.5 text-sm">
                                  {website.members.map((m) => (
                                    <li key={m.user.id} className="flex justify-between admin-text-secondary">
                                      <span>{m.user.name || m.user.email}</span>
                                      <span className="text-xs admin-text-faint">{m.role}</span>
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
            <div className="px-4 pb-4">
              <AdminPagination
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setPage(1)
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
