'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Copy,
  Check,
  Search,
  User,
  Globe,
  Code2,
  Activity,
  MessageSquare,
  Users,
  ExternalLink,
} from 'lucide-react'
import { useToast } from '@/lib/toast'
import { ADMIN_SPLIT_DETAIL, useAdminMobileDetail } from '@/lib/hooks/use-inbox-mobile-chat'

type Owner = {
  id: string
  email: string
  name: string | null
  lastSeenAt: string | null
  createdAt: string
  role: string
}

type TeamMember = {
  role: string
  user: { id: string; email: string; name: string | null }
}

type CustomerSite = {
  id: string
  name: string
  domain: string
  websiteId: string
  plan: string
  subscriptionStatus: string
  widgetStatus: string
  widgetStatusLabel: string
  embedSnippet: string
  registeredSiteUrl: string | null
  widgetFirstPageUrl: string | null
  widgetLastPageUrl: string | null
  widgetEmbedHosts: string[]
  widgetEmbedPages: string[]
  lastActiveAt: string | null
  widgetFirstSeenAt: string | null
  trialStartsAt: string | null
  trialEndsAt: string | null
  trialUsed: boolean
  trialBonusWidgetGranted: boolean
  trialBonusChatGranted: boolean
  isTrialActive: boolean
  signupUtmSource: string | null
  signupUtmMedium: string | null
  signupUtmCampaign: string | null
  signupReferrer: string | null
  signupLandingPage: string | null
  owner: Owner
  members: TeamMember[]
  _count: { conversations: number; members: number; visitors: number; visitorSessions: number }
  createdAt: string
  updatedAt: string
}

const widgetBadge: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  INSTALLED: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  INACTIVE: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  NEVER: 'admin-badge-muted border',
}

const planBadge: Record<string, string> = {
  FREE: 'admin-badge-muted',
  STARTER: 'bg-blue-500/10 text-blue-400',
  PRO: 'bg-sky-500/10 text-sky-400',
  BUSINESS: 'bg-emerald-500/10 text-emerald-400',
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ownerLabel(owner: Owner) {
  return owner.name?.trim() || owner.email.split('@')[0]
}

function embedHostLabel(site: CustomerSite) {
  if (site.widgetEmbedHosts.length > 0) return site.widgetEmbedHosts.join(', ')
  return 'Henüz doğrulanmış kurulum yok'
}

function embedPageLabel(site: CustomerSite) {
  return site.widgetLastPageUrl || site.widgetFirstPageUrl || null
}

export default function AdminCustomerSitesPage() {
  const { toast } = useToast()
  const [sites, setSites] = useState<CustomerSite[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'NEVER' | 'INSTALLED'>('ALL')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useAdminMobileDetail(!!selectedId)

  useEffect(() => {
    fetch('/api/admin/websites')
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Yüklenemedi')
        return r.json()
      })
      .then(setSites)
      .catch((e) => toast({ title: e instanceof Error ? e.message : 'Liste yüklenemedi', variant: 'error' }))
      .finally(() => setLoading(false))
  }, [toast])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sites.filter((s) => {
      const matchQ =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.domain.toLowerCase().includes(q) ||
        s.websiteId.toLowerCase().includes(q) ||
        s.owner.email.toLowerCase().includes(q) ||
        (s.owner.name?.toLowerCase().includes(q) ?? false) ||
        s.widgetEmbedHosts.some((h) => h.toLowerCase().includes(q)) ||
        (s.widgetLastPageUrl?.toLowerCase().includes(q) ?? false) ||
        (s.widgetFirstPageUrl?.toLowerCase().includes(q) ?? false)
      if (!matchQ) return false
      if (filter === 'ALL') return true
      if (filter === 'ACTIVE') return s.widgetStatus === 'ACTIVE'
      if (filter === 'NEVER') return s.widgetStatus === 'NEVER'
      if (filter === 'INSTALLED') return s.widgetStatus !== 'NEVER'
      return true
    })
  }, [sites, search, filter])

  useEffect(() => {
    if (loading || selectedId || filtered.length === 0) return
    if (window.matchMedia('(min-width: 768px)').matches) {
      setSelectedId(filtered[0].id)
    }
  }, [loading, filtered, selectedId])

  const selected = filtered.find((s) => s.id === selectedId) ?? sites.find((s) => s.id === selectedId) ?? null

  async function copySnippet(snippet: string) {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      toast({ title: 'Embed kodu kopyalandı', variant: 'success' })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'Kopyalanamadı', variant: 'error' })
    }
  }

  const installedCount = sites.filter((s) => s.widgetStatus !== 'NEVER').length

  return (
    <div className="admin-split-shell h-full min-h-0 flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 sm:px-6 py-4 border-b admin-split-detail-header">
        <h1 className="text-lg sm:text-xl font-bold admin-text">Kullanıcı & Site Bilgileri</h1>
        <p className="text-xs sm:text-sm admin-text-muted mt-1">
          Kim hangi siteye embed kodunu ekledi, widget ne zaman aktif oldu — tek ekranda
        </p>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div
          className={`admin-split-list w-full md:w-[340px] lg:w-[360px] xl:w-[400px] shrink-0 flex flex-col border-r ${
            selected ? 'hidden md:flex' : 'flex flex-1 md:flex-none'
          }`}
        >
          <div className="p-3 space-y-2 border-b" style={{ borderColor: 'var(--admin-border)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 admin-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="İsim, e-posta, site, domain…"
                className="admin-form-input h-10 pl-9 pr-3 rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {(
                [
                  ['ALL', 'Tümü'],
                  ['ACTIVE', 'Aktif widget'],
                  ['INSTALLED', 'Kurulu'],
                  ['NEVER', 'Kod yok'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`admin-filter-chip ${filter === key ? 'admin-filter-chip--active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[10px] admin-text-muted tabular-nums">
              {filtered.length} kayıt · {installedCount}/{sites.length} widget kurulu
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm admin-text-muted">Yükleniyor…</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm admin-text-muted">Kayıt bulunamadı</div>
            ) : (
              filtered.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => setSelectedId(site.id)}
                  className={`admin-split-list-item ${selectedId === site.id ? 'admin-split-list-item--active' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm admin-text truncate">{site.name}</p>
                      <p className="text-xs admin-text-secondary truncate mt-0.5">Panel domain: {site.domain}</p>
                      <p className={`text-xs truncate mt-0.5 ${site.widgetEmbedHosts.length ? 'text-emerald-400/90' : 'text-amber-500/80'}`}>
                        {embedHostLabel(site)}
                      </p>
                      {embedPageLabel(site) && (
                        <p className="text-[11px] admin-text-muted truncate mt-0.5">{embedPageLabel(site)}</p>
                      )}
                      <p className="text-[11px] admin-text-muted truncate mt-1">
                        {ownerLabel(site.owner)} · {site.owner.email}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border ${widgetBadge[site.widgetStatus] || widgetBadge.NEVER}`}
                    >
                      {site.widgetStatus === 'NEVER' ? 'Kod yok' : site.widgetStatus === 'ACTIVE' ? 'Aktif' : 'Kurulu'}
                    </span>
                  </div>
                  {site.widgetFirstSeenAt && (
                    <p className="text-[10px] admin-text-muted mt-1.5">
                      Widget: {fmtDate(site.widgetFirstSeenAt)}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div
          className={`admin-split-detail flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden ${
            selected ? ADMIN_SPLIT_DETAIL : 'hidden md:flex'
          }`}
        >
          {!selected ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <Users className="w-12 h-12 admin-text-faint mx-auto mb-3" />
                <p className="admin-text-secondary text-sm">Soldan bir kullanıcı / site seçin</p>
                <p className="admin-text-muted text-xs mt-1">Embed kodu, kurulum tarihi ve iletişim bilgileri burada görünür</p>
              </div>
            </div>
          ) : (
            <>
              <div className="admin-split-detail-header shrink-0 px-4 py-3 border-b flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="md:hidden p-2 -ml-1 rounded-lg admin-mobile-topbar-btn"
                  aria-label="Geri"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold admin-text truncate">{selected.name}</h2>
                  <p className="text-xs admin-text-secondary truncate">
                    Kayıtlı domain: {selected.domain}
                  </p>
                  {selected.widgetLastPageUrl ? (
                    <a
                      href={selected.widgetLastPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 truncate max-w-full mt-0.5"
                    >
                      Kurulu site: {selected.widgetLastPageUrl}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-xs text-amber-500/80 mt-0.5">
                      Widget henüz bir müşteri sitesinde görülmedi
                    </p>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${planBadge[selected.plan] || planBadge.FREE}`}>
                  {selected.plan}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                <section className="admin-detail-section">
                  <h3 className="admin-detail-section-title">
                    <User className="w-3.5 h-3.5" />
                    Kullanıcı bilgileri
                  </h3>
                  <dl className="grid gap-2.5 text-sm">
                    <Row label="Ad Soyad" value={selected.owner.name || '—'} />
                    <Row label="E-posta" value={selected.owner.email} />
                    <Row label="Hesap açılışı" value={fmtDate(selected.owner.createdAt)} />
                    <Row label="Son giriş" value={fmtDate(selected.owner.lastSeenAt)} />
                    <Row label="Rol" value={selected.owner.role} />
                  </dl>
                  <Link href={`/admin/users?highlight=${selected.owner.id}`} className="admin-text-link text-xs mt-3 inline-flex items-center gap-1.5">
                    Kullanıcı panelinde aç
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </section>

                <section className="admin-detail-section">
                  <h3 className="admin-detail-section-title">
                    <Globe className="w-3.5 h-3.5" />
                    Site bilgileri
                  </h3>
                  <dl className="grid gap-2.5 text-sm">
                    <Row label="Site adı" value={selected.name} />
                    <Row label="Kayıtlı domain" value={selected.domain} />
                    <Row
                      label="Kayıtlı site linki"
                      value={
                        selected.registeredSiteUrl ? (
                          <LinkRow href={selected.registeredSiteUrl} label={selected.registeredSiteUrl} />
                        ) : (
                          '—'
                        )
                      }
                    />
                    <Row label="Site ID" value={selected.websiteId} mono />
                    <Row label="Site oluşturma" value={fmtDate(selected.createdAt)} />
                    <Row label="Son güncelleme" value={fmtDate(selected.updatedAt)} />
                    <Row label="Abonelik durumu" value={selected.subscriptionStatus} />
                    <Row label="Deneme aktif" value={selected.isTrialActive ? 'Evet' : 'Hayır'} />
                    <Row label="Deneme başlangıcı" value={fmtDate(selected.trialStartsAt)} />
                    <Row label="Deneme bitişi" value={fmtDate(selected.trialEndsAt)} />
                    <Row label="Deneme kullanıldı" value={selected.trialUsed ? 'Evet' : 'Hayır'} />
                    <Row label="Kaynak (UTM source)" value={selected.signupUtmSource || '—'} />
                    <Row label="Kaynak (UTM medium)" value={selected.signupUtmMedium || '—'} />
                    <Row label="Kaynak (UTM campaign)" value={selected.signupUtmCampaign || '—'} />
                    <Row
                      label="Kayıt referrer"
                      value={
                        selected.signupReferrer ? (
                          <LinkRow href={selected.signupReferrer} label={selected.signupReferrer} />
                        ) : (
                          '—'
                        )
                      }
                    />
                    <Row
                      label="Kayıt landing page"
                      value={
                        selected.signupLandingPage ? (
                          <LinkRow href={selected.signupLandingPage} label={selected.signupLandingPage} />
                        ) : (
                          '—'
                        )
                      }
                    />
                  </dl>
                </section>

                <section className="admin-detail-section border-emerald-500/20 bg-emerald-500/[0.04]">
                  <h3 className="admin-detail-section-title text-emerald-400/90">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Widget&apos;ın gerçekten kurulu olduğu site
                  </h3>
                  <p className="text-[11px] admin-text-muted mb-3">
                    Sadece embed kodunun müşteri sitesinde yüklendiği doğrulanmış adresler. Domain satış /
                    parking sayfaları (HugeDomains vb.) ve Gu Live Chat paneli burada gösterilmez.
                  </p>
                  <dl className="grid gap-2.5 text-sm">
                    <Row
                      label="Kurulu domainler"
                      value={
                        selected.widgetEmbedHosts.length > 0 ? (
                          <ul className="space-y-1 text-right">
                            {selected.widgetEmbedHosts.map((host) => (
                              <li key={host}>
                                <LinkRow href={`https://${host}`} label={host} />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          'Henüz kayıt yok — kod müşteri sitesinde açılmamış olabilir'
                        )
                      }
                    />
                    <Row
                      label="İlk görülen sayfa"
                      value={
                        selected.widgetFirstPageUrl ? (
                          <LinkRow href={selected.widgetFirstPageUrl} label={selected.widgetFirstPageUrl} />
                        ) : (
                          '—'
                        )
                      }
                    />
                    <Row
                      label="Son görülen sayfa"
                      value={
                        selected.widgetLastPageUrl ? (
                          <LinkRow href={selected.widgetLastPageUrl} label={selected.widgetLastPageUrl} />
                        ) : (
                          '—'
                        )
                      }
                    />
                    {selected.widgetEmbedPages.length > 0 && (
                      <Row
                        label="Görülen tüm sayfalar"
                        value={
                          <ul className="space-y-1 text-right max-h-40 overflow-y-auto">
                            {selected.widgetEmbedPages.map((page) => (
                              <li key={page}>
                                <LinkRow href={page} label={page} />
                              </li>
                            ))}
                          </ul>
                        }
                      />
                    )}
                  </dl>
                </section>

                <section className="admin-detail-section">
                  <h3 className="admin-detail-section-title">
                    <Code2 className="w-3.5 h-3.5" />
                    Embed kodu & widget durumu
                  </h3>
                  <dl className="grid gap-2.5 text-sm mb-4">
                    <Row
                      label="Durum"
                      value={
                        <span className={`inline-flex text-[11px] font-bold px-2 py-0.5 rounded border ${widgetBadge[selected.widgetStatus]}`}>
                          {selected.widgetStatusLabel}
                        </span>
                      }
                    />
                    <Row
                      label="İlk widget yüklemesi"
                      value={
                        selected.widgetFirstSeenAt
                          ? fmtDate(selected.widgetFirstSeenAt)
                          : selected.widgetStatus === 'NEVER'
                            ? 'Henüz sitede görülmedi'
                            : 'Tarih kaydı yok'
                      }
                    />
                    <Row label="Son widget aktivitesi" value={fmtDate(selected.lastActiveAt)} />
                    <Row label="Trial widget bonusu" value={selected.trialBonusWidgetGranted ? 'Verildi ✓' : 'Hayır'} />
                    <Row label="Trial chat bonusu" value={selected.trialBonusChatGranted ? 'Verildi ✓' : 'Hayır'} />
                  </dl>
                  <p className="text-[11px] admin-text-muted mb-2">
                    Bu kod yalnızca <strong className="admin-text-secondary">{selected.name}</strong> paneline bağlıdır (
                    <code className="text-violet-400">{selected.websiteId}</code>).
                    {selected.widgetEmbedHosts.length > 0 && (
                      <>
                        {' '}
                        Canlı sitede şu adres(ler)de görüldü:{' '}
                        <strong className="text-emerald-400/90">{selected.widgetEmbedHosts.join(', ')}</strong>
                      </>
                    )}
                  </p>
                  <pre
                    className="text-[11px] leading-relaxed p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all admin-text-secondary"
                    style={{ background: 'var(--admin-bg-subtle)', border: '1px solid var(--admin-border)' }}
                  >
                    {selected.embedSnippet}
                  </pre>
                  <button
                    type="button"
                    onClick={() => void copySnippet(selected.embedSnippet)}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Embed kodunu kopyala
                  </button>
                </section>

                <section className="admin-detail-section">
                  <h3 className="admin-detail-section-title">
                    <Activity className="w-3.5 h-3.5" />
                    Kullanım
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Stat icon={MessageSquare} label="Sohbet" value={selected._count.conversations} />
                    <Stat icon={Users} label="Ziyaretçi" value={selected._count.visitors} />
                    <Stat icon={Activity} label="Oturum" value={selected._count.visitorSessions} />
                    <Stat icon={User} label="Ekip" value={selected._count.members} />
                  </div>
                </section>

                {selected.members.length > 1 && (
                  <section className="admin-detail-section">
                    <h3 className="admin-detail-section-title">Ekip üyeleri</h3>
                    <ul className="space-y-2">
                      {selected.members.map((m) => (
                        <li key={m.user.id} className="flex items-center justify-between text-sm gap-2">
                          <span className="admin-text-secondary truncate">
                            {m.user.name || m.user.email}
                          </span>
                          <span className="text-[10px] admin-text-muted shrink-0">{m.role}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Link href="/admin/inbox" className="admin-btn-secondary">Gelen kutusu</Link>
                  <Link href="/admin/conversations" className="admin-btn-secondary">Tüm sohbetler</Link>
                  <Link href="/admin/websites" className="admin-btn-secondary">Site yönetimi</Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 sm:justify-between">
      <dt className="admin-text-muted text-xs shrink-0">{label}</dt>
      <dd className={`admin-text-secondary text-right sm:text-right break-all ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value}
      </dd>
    </div>
  )
}

function LinkRow({ href, label }: { href: string; label: string }) {
  const safe = href.startsWith('http') ? href : `https://${href}`
  return (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 break-all"
    >
      <span>{label}</span>
      <ExternalLink className="w-3 h-3 shrink-0" />
    </a>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <div className="admin-stat-card">
      <Icon className="w-4 h-4 text-violet-400 mx-auto mb-1" />
      <p className="text-lg font-bold admin-text tabular-nums">{value}</p>
      <p className="text-[10px] admin-text-muted">{label}</p>
    </div>
  )
}
