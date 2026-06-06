'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'

interface Addon {
  id: string
  slug: string
  name: string
  description: string
  longDescription: string | null
  category: string
  icon: string | null
  price: number
  purchaseType: string
  isFeatured: boolean
  isActive: boolean
  version: string
  developer: string
  docsUrl: string | null
  configSchema: string | null
  setupGuide: string | null
  permissions: string | null
}

interface Purchase {
  id: string
  addonId: string
  isActive: boolean
  config: string | null
  autoRenew: boolean
  expiresAt: string | null
  cancelledAt: string | null
  createdAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  SOCIAL: 'Sosyal',
  MARKETING: 'Pazarlama',
  AI: 'AI',
  ANALYTICS: 'Analitik',
  CRM: 'CRM',
  SUPPORT: 'Destek',
  AUTOMATION: 'Otomasyon',
  ECOMMERCE: 'E-ticaret',
  CUSTOM: 'Özel',
  SECURITY: 'Güvenlik',
}

export default function AddonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const addonId = params.addonId as string
  const { activeWebsite } = useActiveWebsite()

  const [addon, setAddon] = useState<Addon | null>(null)
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [configValues, setConfigValues] = useState<Record<string, any>>({})

  useEffect(() => {
    async function fetchData() {
      try {
        const paramsStr = activeWebsite ? `?websiteId=${activeWebsite.websiteId}` : ''
        const res = await fetch(`/api/addons${paramsStr}`)
        if (res.ok) {
          const data = await res.json()
          const found = data.addons?.find((a: Addon) => a.id === addonId)
          setAddon(found || null)

          const purchaseData = data.purchases?.find((p: Purchase) => p.addonId === addonId)
          if (purchaseData) {
            setPurchase(purchaseData)
            if (purchaseData.config) {
              try {
                setConfigValues(JSON.parse(purchaseData.config))
              } catch {}
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch addon:', err)
      } finally {
        setLoading(false)
      }
    }
    if (activeWebsite) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [addonId, activeWebsite])

  const configSchema = useMemo(() => {
    if (!addon?.configSchema) return null
    try {
      return JSON.parse(addon.configSchema)
    } catch {
      return null
    }
  }, [addon])

  const properties = configSchema?.properties || {}
  const propertyKeys = Object.keys(properties)

  const handleToggle = async () => {
    if (!activeWebsite) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/addons/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: activeWebsite.websiteId, addonId, action: 'toggle' }),
      })
      const data = await res.json()
      if (res.ok) {
        setPurchase(data.purchase)
        setMessage({ type: 'success', text: data.message })
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'İşlem başarısız' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    if (!activeWebsite) return
    if (!confirm('Aboneliğinizi iptal etmek istediğinize emin misiniz? Eklenti, dönem sonunda devre dışı kalacaktır.')) return

    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/addons/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: activeWebsite.websiteId, addonId, action: 'cancel' }),
      })
      const data = await res.json()
      if (res.ok) {
        setPurchase(data.purchase)
        setMessage({ type: 'success', text: data.message })
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'İşlem başarısız' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!activeWebsite) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/addons/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: activeWebsite.websiteId,
          addonId,
          action: 'config',
          config: configValues,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setPurchase(data.purchase)
        setMessage({ type: 'success', text: data.message })
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Kaydetme başarısız' })
    } finally {
      setSaving(false)
    }
  }

  const updateConfigValue = (key: string, value: any) => {
    setConfigValues(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!addon) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <button onClick={() => router.back()} className="text-sm text-primary hover:underline mb-4 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Geri
        </button>
        <div className="text-center py-20">
          <h2 className="text-lg font-semibold text-foreground">Eklenti bulunamadı</h2>
          <p className="text-sm text-muted-foreground mt-1">Bu eklenti mevcut değil veya kaldırılmış</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <button
        onClick={() => router.push('/settings/addons')}
        className="text-sm text-primary hover:underline mb-6 inline-flex items-center gap-1 font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Mağazaya Dön
      </button>

      {message && (
        <div className={`mb-6 p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        </div>
      )}

      <div className="surface p-5 sm:p-6 mb-6">
        <div className="flex items-start gap-4 sm:gap-5">
          <div className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl flex items-center justify-center text-3xl ${
            addon.isFeatured
              ? 'bg-primary-light'
              : 'bg-muted'
          }`}>
            {addon.icon || '🧩'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground">{addon.name}</h1>
                  {addon.isFeatured && (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-primary text-primary-foreground rounded-full">
                      Öne Çıkan
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{addon.description}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {addon.price === 0 ? 'Ücretsiz' : `₺${(addon.price / 100).toLocaleString('tr-TR')}`}
                </div>
                {addon.price > 0 && (
                  <p className="text-xs text-muted-foreground">
                    /{addon.purchaseType === 'YEARLY' ? 'yıl' : 'ay'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-3 mt-3">
              <span className="px-2.5 py-0.5 bg-primary-light text-primary text-xs font-medium rounded-md">
                {CATEGORY_LABELS[addon.category] || addon.category}
              </span>
              <span className="text-xs text-muted-foreground">v{addon.version}</span>
              <span className="text-xs text-muted-foreground">{addon.developer}</span>
            </div>
          </div>
        </div>
      </div>

      {purchase && (
        <div className="surface p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Durum</h2>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                purchase.isActive
                  ? 'bg-success-light text-success'
                  : 'bg-destructive-light text-destructive'
              }`}>
                {purchase.isActive ? 'Aktif' : 'Devre Dışı'}
              </span>
              <button
                onClick={handleToggle}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  purchase.isActive ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  purchase.isActive ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Satın Alınma</span>
              <p className="font-medium text-foreground">
                {new Date(purchase.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
            {purchase.expiresAt && (
              <div>
                <span className="text-muted-foreground">Bitiş Tarihi</span>
                <p className="font-medium text-foreground">
                  {new Date(purchase.expiresAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Otomatik Yenileme</span>
              <p className={`font-medium ${purchase.autoRenew ? 'text-success' : 'text-muted-foreground'}`}>
                {purchase.autoRenew ? 'Aktif' : 'Kapalı'}
              </p>
            </div>
          </div>
          {purchase.cancelledAt && (
            <div className="mt-4 p-3 bg-destructive-light border border-destructive/30 rounded-xl">
              <p className="text-xs text-destructive">
                Abonelik iptal edildi — {new Date(purchase.cancelledAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          )}
        </div>
      )}

      {addon.longDescription && (
        <div className="surface p-5 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">Açıklama</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{addon.longDescription}</p>
        </div>
      )}

      {addon.setupGuide && (
        <div className="surface p-5 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">Kurulum Kılavuzu</h2>
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{addon.setupGuide}</div>
        </div>
      )}

      {propertyKeys.length > 0 && (
        <div className="surface p-5 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Yapılandırma</h2>
          <div className="space-y-4">
            {propertyKeys.map(key => {
              const prop = properties[key]
              const value = configValues[key] ?? ''

              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{prop.title || key}</label>
                  {prop.type === 'boolean' ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => updateConfigValue(key, e.target.checked)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-muted-foreground">{prop.title || key}</span>
                    </label>
                  ) : prop.enum ? (
                    <select
                      value={value}
                      onChange={(e) => updateConfigValue(key, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    >
                      <option value="">Seçiniz</option>
                      {prop.enum.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={prop.type === 'number' ? 'number' : 'text'}
                      value={value}
                      onChange={(e) => updateConfigValue(key, prop.type === 'number' ? Number(e.target.value) : e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder={prop.title || key}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {addon.permissions && (
        <div className="surface p-5 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">İzinler</h2>
          <div className="flex flex-wrap gap-2">
            {(JSON.parse(addon.permissions) as string[]).map(perm => (
              <span key={perm} className="px-2.5 py-1 bg-primary-light text-primary text-xs font-mono rounded-md">
                {perm}
              </span>
            ))}
          </div>
        </div>
      )}

      {purchase && !purchase.cancelledAt && (
        <div className="surface !border-destructive/40 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-destructive">Aboneliği İptal Et</h3>
              <p className="text-xs text-muted-foreground mt-0.5">İptal edildiğinde dönem sonuna kadar kullanmaya devam edebilirsiniz</p>
            </div>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 bg-destructive hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-destructive-foreground text-sm font-medium rounded-xl transition shrink-0"
            >
              {saving ? 'İşleniyor...' : 'Aboneliği İptal Et'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
