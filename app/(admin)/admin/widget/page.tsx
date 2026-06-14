'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  WidgetSettingsPanel,
  type WidgetWebsiteInfo,
  widgetConfigToPayload,
} from '@/components/settings/widget-settings-panel'
import { AdminPageHeader } from '@/components/admin/admin-page-header'

type AdminWebsiteRow = {
  id: string
  websiteId: string
  name: string
  domain: string
}

export default function AdminWidgetPage() {
  return (
    <Suspense fallback={<div className="admin-page admin-text-muted text-sm">Yükleniyor…</div>}>
      <AdminWidgetContent />
    </Suspense>
  )
}

function AdminWidgetContent() {
  const searchParams = useSearchParams()
  const [websites, setWebsites] = useState<AdminWebsiteRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [website, setWebsite] = useState<WidgetWebsiteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingSite, setLoadingSite] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const siteFromUrl = searchParams.get('site')
    Promise.all([
      fetch('/api/admin/websites').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/admin/marketing-website').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([list, marketing]) => {
        const rows = Array.isArray(list) ? list : []
        setWebsites(rows)
        const defaultId =
          (siteFromUrl && rows.some((w: AdminWebsiteRow) => w.id === siteFromUrl) ? siteFromUrl : null) ||
          marketing?.id ||
          rows[0]?.id ||
          null
        setSelectedId(defaultId)
      })
      .catch(() => setError('Siteler yüklenemedi'))
      .finally(() => setLoading(false))
  }, [searchParams])

  const loadWebsite = useCallback(async (id: string) => {
    setLoadingSite(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/websites/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Site yüklenemedi')
      setWebsite(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Site yüklenemedi')
      setWebsite(null)
    } finally {
      setLoadingSite(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedId) return
    void loadWebsite(selectedId)
  }, [selectedId, loadWebsite])

  const handleSave = async (payload: ReturnType<typeof widgetConfigToPayload>) => {
    if (!selectedId) throw new Error('Site seçilmedi')
    const res = await fetch(`/api/admin/websites/${selectedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Kaydetme başarısız')
    setWebsite(data)
  }

  const selected = websites.find((w) => w.id === selectedId)

  return (
    <div className="admin-page max-w-6xl">
      <AdminPageHeader
        title="Sohbet Widget Ayarları"
        description="Her sitenin widget rengini, mesajlarını ve davranışını buradan yönetin"
      />

      {loading ? (
        <p className="text-sm admin-text-muted">Yükleniyor…</p>
      ) : (
        <>
          <div className="admin-form-section mb-6">
            <label className="admin-form-label" htmlFor="admin-widget-site">Site seçin</label>
            <select
              id="admin-widget-site"
              value={selectedId || ''}
              onChange={(e) => setSelectedId(e.target.value)}
              className="admin-form-select max-w-md px-4 py-2.5 cursor-pointer"
            >
              {websites.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {w.domain}
                </option>
              ))}
            </select>
            {selected && (
              <p className="text-xs admin-text-muted mt-2 font-mono break-all">
                ID: {selected.websiteId}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 mb-4">{error}</p>
          )}

          {loadingSite ? (
            <p className="text-sm admin-text-muted">Widget ayarları yükleniyor…</p>
          ) : (
            <WidgetSettingsPanel
              website={website}
              onSave={handleSave}
              subtitle={
                selected
                  ? `${selected.name} sitesinin canlı widget görünümünü özelleştirin. Değişiklikler kaydedildiğinde sitede hemen yansır.`
                  : undefined
              }
            />
          )}
        </>
      )}
    </div>
  )
}
