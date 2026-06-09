'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  WidgetSettingsPanel,
  type WidgetWebsiteInfo,
  widgetConfigToPayload,
} from '@/components/settings/widget-settings-panel'

type AdminWebsiteRow = {
  id: string
  websiteId: string
  name: string
  domain: string
}

export default function AdminWidgetPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-400">Yükleniyor…</div>}>
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Sohbet Widget Ayarları</h1>
        <p className="text-sm text-gray-400 mt-1">
          Her sitenin widget rengini, mesajlarını ve davranışını buradan yönetin
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Yükleniyor…</p>
      ) : (
        <>
          <div className="mb-6 app-panel p-4 sm:p-5">
            <label className="block text-sm font-medium text-white mb-2">Site seçin</label>
            <select
              value={selectedId || ''}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full max-w-md px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {websites.map((w) => (
                <option key={w.id} value={w.id} className="text-gray-900">
                  {w.name} — {w.domain}
                </option>
              ))}
            </select>
            {selected && (
              <p className="text-xs text-gray-500 mt-2 font-mono break-all">
                ID: {selected.websiteId}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 mb-4">{error}</p>
          )}

          {loadingSite ? (
            <p className="text-sm text-gray-400">Widget ayarları yükleniyor…</p>
          ) : (
            <div className="text-foreground">
              <WidgetSettingsPanel
                website={website}
                onSave={handleSave}
                subtitle={
                  selected
                    ? `${selected.name} sitesinin canlı widget görünümünü özelleştirin. Değişiklikler kaydedildiğinde sitede hemen yansır.`
                    : undefined
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
