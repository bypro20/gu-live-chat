'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { usePlanFeature } from '@/lib/hooks/use-plan-feature'
import PlanUpgradePrompt from '@/components/dashboard/plan-upgrade-prompt'

const COMPONENT_STATUSES = [
  { value: 'OPERATIONAL', label: 'Çalışıyor', color: 'text-success' },
  { value: 'DEGRADED_PERFORMANCE', label: 'Yavaşlama', color: 'text-warning' },
  { value: 'PARTIAL_OUTAGE', label: 'Kısmi Kesinti', color: 'text-orange-500' },
  { value: 'MAJOR_OUTAGE', label: 'Büyük Kesinti', color: 'text-destructive' },
  { value: 'UNDER_MAINTENANCE', label: 'Bakımda', color: 'text-muted-foreground' },
]

const INCIDENT_STATUSES = [
  { value: 'INVESTIGATING', label: 'İnceleniyor' },
  { value: 'IDENTIFIED', label: 'Tespit Edildi' },
  { value: 'MONITORING', label: 'İzleniyor' },
  { value: 'RESOLVED', label: 'Çözüldü' },
]

interface StatusPageData {
  id: string
  title: string
  description: string
  subdomain: string
  logoUrl: string
  primaryColor: string
  twitterHandle: string
  isActive: boolean
  isPublic: boolean
  showHistory: boolean
}

interface Component {
  id: string
  name: string
  description: string
  status: string
  order: number
  groupName: string
}

interface IncidentUpdate {
  id: string
  status: string
  message: string
  createdAt: string
}

interface Incident {
  id: string
  title: string
  status: string
  severity: string
  message: string
  components: string
  startedAt: string
  resolvedAt: string | null
  updates: IncidentUpdate[]
}

export default function StatusPageSettingsPage() {
  const { allowed: planAllowed, isLoading: planLoading } = usePlanFeature('statusPage')
  const router = useRouter()
  const { activeWebsite } = useActiveWebsite()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pageData, setPageData] = useState<StatusPageData>({
    id: '',
    title: 'Service Status',
    description: '',
    subdomain: '',
    logoUrl: '',
    primaryColor: '#1972F5',
    twitterHandle: '',
    isActive: true,
    isPublic: true,
    showHistory: true,
  })
  const [components, setComponents] = useState<Component[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [showNewIncident, setShowNewIncident] = useState(false)
  const [newIncident, setNewIncident] = useState({ title: '', message: '', severity: 'MEDIUM' })
  const [newComponent, setNewComponent] = useState({ name: '', description: '', groupName: '' })

  const fetchPageData = useCallback(async () => {
    if (!activeWebsite?.id) {
      setLoading(false)
      return
    }
    try {
      const statusRes = await fetch(`/api/status-page?websiteId=${activeWebsite.id}`)
      if (!statusRes.ok) throw new Error('Not found')
      const data = await statusRes.json()
      setPageData(data.page)
      setComponents(data.components)
      setIncidents(data.incidents)
    } catch {
      setPageData((prev) => ({ ...prev, id: '' }))
      setComponents([])
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }, [activeWebsite?.id])

  useEffect(() => {
    setLoading(true)
    fetchPageData()
  }, [fetchPageData])

  async function savePage() {
    if (!activeWebsite?.id) return
    setSaving(true)
    try {
      const body = { ...pageData, websiteId: activeWebsite.id }
      await fetch('/api/status-page', {
        method: pageData.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function addComponent() {
    if (!newComponent.name) return
    try {
      const res = await fetch(`/api/status-page/${pageData.id}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComponent),
      })
      if (res.ok) {
        const comp = await res.json()
        setComponents([...components, comp])
        setNewComponent({ name: '', description: '', groupName: '' })
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function updateComponentStatus(componentId: string, status: string) {
    try {
      await fetch(`/api/status-page/${pageData.id}/components`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: componentId, status }),
      })
      setComponents(components.map(c => c.id === componentId ? { ...c, status } : c))
    } catch (e) {
      console.error(e)
    }
  }

  async function deleteComponent(componentId: string) {
    try {
      await fetch(`/api/status-page/${pageData.id}/components`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: componentId }),
      })
      setComponents(components.filter(c => c.id !== componentId))
    } catch (e) {
      console.error(e)
    }
  }

  async function createIncident() {
    if (!newIncident.title || !newIncident.message) return
    try {
      const res = await fetch(`/api/status-page/${pageData.id}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncident),
      })
      if (res.ok) {
        const inc = await res.json()
        setIncidents([inc, ...incidents])
        setNewIncident({ title: '', message: '', severity: 'MEDIUM' })
        setShowNewIncident(false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function updateIncidentStatus(incidentId: string, status: string) {
    try {
      await fetch(`/api/status-page/${pageData.id}/incidents`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: incidentId, status }),
      })
      const updated = incidents.map(i => i.id === incidentId ? { ...i, status } : i)
      setIncidents(updated)
    } catch (e) {
      console.error(e)
    }
  }

  function getStatusColor(status: string) {
    const s = COMPONENT_STATUSES.find(cs => cs.value === status)
    return s?.color || 'text-muted-foreground'
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-72 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!planLoading && !planAllowed) {
    return <PlanUpgradePrompt feature="statusPage" />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Durum Sayfası</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistem durumunuzu müşterilerinizle paylaşın
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pageData.subdomain && pageData.isActive && (
            <a
              href={`/${pageData.subdomain}`}
              target="_blank"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-muted text-foreground font-medium rounded-xl hover:bg-accent transition text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Önizle
            </a>
          )}
          <button
            onClick={savePage}
            disabled={saving}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-semibold transition text-sm ${
              saved
                ? 'bg-success text-success-foreground'
                : 'bg-primary hover:bg-primary-hover text-primary-foreground'
            }`}
          >
            {saved ? '✓ Kaydedildi' : saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Settings Card */}
        <div className="surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Sayfa Ayarları</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Başlık</label>
              <input
                type="text"
                value={pageData.title}
                onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl bg-muted text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Alt Alan Adı</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={pageData.subdomain}
                  onChange={(e) => setPageData({ ...pageData, subdomain: e.target.value })}
                  className="flex-1 px-4 py-3 border border-border rounded-xl bg-muted text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition"
                  placeholder="status"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">.gu-live-chat.com</span>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">Açıklama</label>
              <textarea
                value={pageData.description}
                onChange={(e) => setPageData({ ...pageData, description: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl bg-muted text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition resize-none"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Logo URL</label>
              <input
                type="text"
                value={pageData.logoUrl}
                onChange={(e) => setPageData({ ...pageData, logoUrl: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl bg-muted text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Twitter Kullanıcı Adı</label>
              <input
                type="text"
                value={pageData.twitterHandle}
                onChange={(e) => setPageData({ ...pageData, twitterHandle: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl bg-muted text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition"
                placeholder="@handle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Ana Renk</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={pageData.primaryColor}
                  onChange={(e) => setPageData({ ...pageData, primaryColor: e.target.value })}
                  className="w-12 h-12 rounded-xl border-2 border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={pageData.primaryColor}
                  onChange={(e) => setPageData({ ...pageData, primaryColor: e.target.value })}
                  className="flex-1 px-4 py-3 border border-border rounded-xl bg-muted text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pageData.isActive}
                onChange={(e) => setPageData({ ...pageData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
              />
              <span className="text-sm font-medium text-foreground">Aktif</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pageData.showHistory}
                onChange={(e) => setPageData({ ...pageData, showHistory: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
              />
              <span className="text-sm font-medium text-foreground">Geçmişi Göster</span>
            </label>
          </div>
        </div>

        {/* Components Card */}
        <div className="surface p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Bileşenler</h2>
            {pageData.id && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComponent.name}
                  onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                  className="flex-1 sm:flex-initial px-3 py-2 border border-border rounded-xl bg-muted text-sm text-foreground focus:ring-2 focus:ring-ring outline-none"
                  placeholder="Bileşen adı"
                />
                <button
                  onClick={addComponent}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-xl text-sm transition shrink-0"
                >
                  Ekle
                </button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {components.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Henüz bileşen eklenmemiş. Önce durum sayfasını kaydedin.
              </p>
            )}
            {components.map((comp) => (
              <div key={comp.id} className="flex items-center justify-between gap-3 p-3 bg-muted rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{comp.name}</p>
                  {comp.description && (
                    <p className="text-xs text-muted-foreground truncate">{comp.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={comp.status}
                    onChange={(e) => updateComponentStatus(comp.id, e.target.value)}
                    className={`px-3 py-1.5 border border-border rounded-lg text-sm font-medium bg-background ${getStatusColor(comp.status)} focus:ring-2 focus:ring-ring outline-none`}
                  >
                    {COMPONENT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => deleteComponent(comp.id)}
                    className="p-1.5 text-destructive hover:bg-destructive-light rounded-lg transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incidents Card */}
        <div className="surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Olaylar</h2>
            {pageData.id && (
              <button
                onClick={() => setShowNewIncident(!showNewIncident)}
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium rounded-xl text-sm transition shrink-0"
              >
                + Olay Bildir
              </button>
            )}
          </div>

          {showNewIncident && (
            <div className="bg-muted rounded-xl p-4 mb-4 space-y-3">
              <input
                type="text"
                value={newIncident.title}
                onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                placeholder="Olay başlığı"
              />
              <textarea
                value={newIncident.message}
                onChange={(e) => setNewIncident({ ...newIncident, message: e.target.value })}
                className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
                rows={3}
                placeholder="Olay açıklaması"
              />
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <select
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                  className="px-3 py-2 border border-border rounded-xl bg-background text-foreground text-sm focus:ring-2 focus:ring-ring outline-none"
                >
                  <option value="LOW">Düşük</option>
                  <option value="MEDIUM">Orta</option>
                  <option value="HIGH">Yüksek</option>
                  <option value="URGENT">Acil</option>
                </select>
                <button
                  onClick={createIncident}
                  className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium rounded-xl text-sm transition"
                >
                  Oluştur
                </button>
                <button
                  onClick={() => setShowNewIncident(false)}
                  className="px-4 py-2 bg-muted text-foreground font-medium rounded-xl text-sm transition border border-border"
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          {incidents.length === 0 && !showNewIncident && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henüz bir olay bildirilmemiş.
            </p>
          )}

          <div className="space-y-3">
            {incidents.map((inc) => (
              <div key={inc.id} className="border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="font-semibold text-foreground text-sm">{inc.title}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        inc.status === 'RESOLVED'
                          ? 'bg-success-light text-success'
                          : inc.status === 'MONITORING'
                            ? 'bg-info-light text-info'
                            : inc.status === 'IDENTIFIED'
                              ? 'bg-warning-light text-warning'
                              : 'bg-destructive-light text-destructive'
                      }`}>
                        {INCIDENT_STATUSES.find(s => s.value === inc.status)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{inc.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(inc.startedAt).toLocaleDateString('tr-TR', {
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <select
                    value={inc.status}
                    onChange={(e) => updateIncidentStatus(inc.id, e.target.value)}
                    className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium bg-background text-foreground focus:ring-2 focus:ring-ring outline-none shrink-0"
                  >
                    {INCIDENT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                {inc.updates.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    {inc.updates.map((u) => (
                      <div key={u.id} className="flex items-start gap-2 text-xs">
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5" />
                        <div>
                          <span className="font-medium text-foreground">
                            {INCIDENT_STATUSES.find(s => s.value === u.status)?.label}
                          </span>
                          <span className="text-muted-foreground"> — {u.message}</span>
                          <p className="text-muted-foreground mt-0.5">
                            {new Date(u.createdAt).toLocaleDateString('tr-TR', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
