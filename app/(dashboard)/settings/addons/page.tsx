'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { useRouter } from 'next/navigation'
import {
  Search, ShoppingCart, Check, X, AlertCircle, Star,
  Sparkles, ArrowRight, ChevronRight, Zap, Settings,
  Power, PowerOff, ExternalLink, Package, Grid3X3,
  Layers, Crown, Timer, TrendingUp, Shield, Store,
} from 'lucide-react'

interface Addon {
  id: string
  slug: string
  name: string
  description: string
  category: string
  icon: string | null
  imageUrl: string | null
  price: number
  purchaseType: string
  isFeatured: boolean
  version: string
  developer: string
  featureKey?: string | null
  requiredPlan?: string | null
  includedInPlan?: boolean
}

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  FREE: { label: 'Ücretsiz', className: 'bg-gray-500/10 text-gray-600' },
  STARTER: { label: 'Başlangıç', className: 'bg-blue-500/10 text-blue-600' },
  PRO: { label: 'Profesyonel', className: 'bg-purple-500/10 text-purple-600' },
  BUSINESS: { label: 'Kurumsal', className: 'bg-amber-500/10 text-amber-600' },
}

interface Purchase {
  addonId: string
  isActive: boolean
  config: string | null
  expiresAt: string | null
  cancelledAt: string | null
}

const CATEGORIES = [
  { key: 'ALL', label: 'Tümü', icon: Grid3X3 },
  { key: 'SOCIAL', label: 'Sosyal', icon: Layers },
  { key: 'MARKETING', label: 'Pazarlama', icon: TrendingUp },
  { key: 'AI', label: 'AI', icon: Zap },
  { key: 'ANALYTICS', label: 'Analitik', icon: Crown },
  { key: 'CRM', label: 'CRM', icon: Package },
  { key: 'SUPPORT', label: 'Destek', icon: Shield },
  { key: 'AUTOMATION', label: 'Otomasyon', icon: Timer },
  { key: 'ECOMMERCE', label: 'E-ticaret', icon: ShoppingCart },
  { key: 'CUSTOM', label: 'Özel', icon: Layers },
]

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

function StarRating({ rating = 5, size = 14 }: { rating?: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}
        />
      ))}
    </div>
  )
}

export default function AddonsPage() {
  const router = useRouter()
  const { activeWebsite, isLoading: websiteLoading } = useActiveWebsite()
  const [addons, setAddons] = useState<Addon[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [purchasingId, setPurchasingId] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [modalAddon, setModalAddon] = useState<Addon | null>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const featuredRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const params = activeWebsite ? `?websiteId=${activeWebsite.websiteId}` : ''
        const res = await fetch(`/api/addons${params}`)
        if (res.ok) {
          const data = await res.json()
          setAddons(data.addons || [])
          setPurchases(data.purchases || [])
          setCurrentPlan(data.plan || null)
        }
      } catch (err) {
        console.error('Failed to fetch addons:', err)
      } finally {
        setLoading(false)
      }
    }
    if (!websiteLoading) {
      fetchData()
    }
  }, [activeWebsite, websiteLoading])

  const purchasedAddonIds = useMemo(() => new Set(purchases.map(p => p.addonId)), [purchases])
  const activePurchaseMap = useMemo(() => {
    const map = new Map<string, Purchase>()
    purchases.forEach(p => map.set(p.addonId, p))
    return map
  }, [purchases])

  const purchasedAddons = useMemo(
    () => addons.filter(a => purchasedAddonIds.has(a.id)),
    [addons, purchasedAddonIds]
  )

  const featuredAddons = useMemo(
    () => addons.filter(a => a.isFeatured && !purchasedAddonIds.has(a.id)),
    [addons, purchasedAddonIds]
  )

  const filteredAddons = useMemo(() => {
    return addons.filter(addon => {
      const matchesCategory = activeCategory === 'ALL' || addon.category === activeCategory
      const matchesSearch = searchQuery === '' ||
        addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        addon.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch && !purchasedAddonIds.has(addon.id)
    })
  }, [addons, activeCategory, searchQuery, purchasedAddonIds])

  const handlePurchase = async (addon: Addon) => {
    if (!activeWebsite) return
    setPurchasingId(addon.id)
    setPurchaseError(null)
    try {
      const res = await fetch('/api/addons/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: activeWebsite.websiteId, addonId: addon.id, action: 'purchase' }),
      })
      const data = await res.json()

      if (res.status === 402 && data.paymentRequired) {
        const payRes = await fetch('/api/paytr/addon-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteId: activeWebsite.websiteId, addonSlug: addon.slug }),
        })
        const payData = await payRes.json()
        if (payRes.ok && payData.iframeUrl) {
          window.location.href = payData.iframeUrl
          return
        }
        setPurchaseError(payData.error || 'Ödeme başlatılamadı')
        return
      }

      if (res.ok) {
        setPurchases(prev => [...prev, { addonId: addon.id, isActive: true, config: null, expiresAt: data.purchase.expiresAt, cancelledAt: null }])
        setModalAddon(null)
      } else {
        setPurchaseError(data.error || 'Satın alma başarısız')
      }
    } catch (err) {
      console.error('Purchase failed:', err)
      setPurchaseError('Bağlantı hatası')
    } finally {
      setPurchasingId(null)
    }
  }

  const handleToggle = async (addonId: string, isActive: boolean) => {
    if (!activeWebsite) return
    try {
      const res = await fetch('/api/addons/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: activeWebsite.websiteId, addonId, action: 'toggle' }),
      })
      if (res.ok) {
        const data = await res.json()
        setPurchases(prev => prev.map(p => p.addonId === addonId ? { ...p, isActive: data.purchase.isActive } : p))
      }
    } catch (err) {
      console.error('Toggle failed:', err)
    }
  }

  const handleCancel = async (addonId: string) => {
    if (!activeWebsite) return
    try {
      const res = await fetch('/api/addons/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: activeWebsite.websiteId, addonId, action: 'cancel' }),
      })
      if (res.ok) {
        setPurchases(prev => prev.map(p => p.addonId === addonId ? { ...p, isActive: false, cancelledAt: new Date().toISOString() } : p))
      }
    } catch (err) {
      console.error('Cancel failed:', err)
    }
  }

  if (loading || websiteLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-80">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-[var(--primary)] rounded-full animate-pulse" />
              </div>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] animate-pulse">Mağaza yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">

        {/* HEADER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--primary)]/5 border border-[var(--border)] p-5 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--primary)]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[var(--primary)]/8 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-[var(--primary)]/30">
                  <Store size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-[var(--foreground)]">Eklenti Mağazası</h1>
                  <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Platformunuzu güçlendirecek premium eklentiler</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial sm:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Eklenti ara..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 outline-none transition placeholder:text-[var(--muted-foreground)]"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                <Package size={14} className="text-[var(--primary)]" />
                <span className="text-xs font-semibold text-[var(--primary)]">{purchases.length} aktif</span>
              </div>
            </div>
          </div>
        </div>

        {purchaseError && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
            {purchaseError}
          </div>
        )}

        {/* CATEGORY TABS */}
        <div className="relative">
          <div ref={categoryRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 shrink-0 ${
                    activeCategory === cat.key
                      ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30 scale-105'
                      : 'bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/40 hover:text-[var(--primary)]'
                  }`}
                >
                  <Icon size={15} />
                  {cat.label}
                </button>
              )
            })}
          </div>
          <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none" />
        </div>

        {/* PURCHASED ADDONS SECTION */}
        {purchasedAddons.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Check size={15} className="text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Eklentilerim</h2>
              <span className="px-2 py-0.5 text-[11px] font-medium bg-green-500/10 text-green-500 rounded-full">{purchasedAddons.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {purchasedAddons.map(addon => {
                const purchase = activePurchaseMap.get(addon.id)
                const isActive = purchase?.isActive ?? false
                const isCancelled = !!purchase?.cancelledAt
                return (
                  <div
                    key={addon.id}
                    className="group relative surface-hover rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-green-500/30 transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                        isActive ? 'bg-green-500/10' : 'bg-[var(--primary-light)]'
                      }`}>
                        {addon.icon || '🧩'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-[var(--foreground)]">{addon.name}</h3>
                            <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">{addon.description}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isCancelled ? (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">İptal</span>
                            ) : isActive ? (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center gap-1">
                                <Check size={10} /> Aktif
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full">Pasif</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          <button
                            onClick={() => router.push(`/settings/addons/${addon.id}`)}
                            className="px-3 py-1.5 text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/20 transition flex items-center gap-1"
                          >
                            <Settings size={12} /> Yönet
                          </button>
                          {!isCancelled && (
                            <button
                              onClick={() => handleToggle(addon.id, !isActive)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1 ${
                                isActive
                                  ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                                  : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                              }`}
                            >
                              {isActive ? <PowerOff size={12} /> : <Power size={12} />}
                              {isActive ? 'Devre Dışı' : 'Aktifleştir'}
                            </button>
                          )}
                          {purchase?.expiresAt && (
                            <span className="text-[10px] text-[var(--muted-foreground)]">
                              {new Date(purchase.expiresAt).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* FEATURED ADDONS CAROUSEL */}
        {featuredAddons.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Öne Çıkan Eklentiler</h2>
            </div>
            <div ref={featuredRef} className="flex gap-5 overflow-x-auto pb-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
              {featuredAddons.map(addon => (
                <div
                  key={addon.id}
                  className="relative shrink-0 w-[340px] lg:w-[400px] rounded-2xl overflow-hidden border border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/10 via-[var(--card)] to-blue-500/10 group cursor-pointer hover:shadow-xl hover:shadow-[var(--primary)]/10 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-transparent pointer-events-none" />
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1 text-[11px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-lg flex items-center gap-1.5">
                      <Sparkles size={12} /> Popüler
                    </span>
                  </div>
                  <div className="p-6 relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-blue-500/20 flex items-center justify-center text-4xl shadow-inner">
                        {addon.icon || '🧩'}
                      </div>
                      <StarRating rating={5} size={13} />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">{addon.name}</h3>
                    <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mb-4 leading-relaxed">{addon.description}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2.5 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] text-[11px] font-medium rounded-md">
                        {CATEGORY_LABELS[addon.category] || addon.category}
                      </span>
                      <span className="text-[11px] text-[var(--muted-foreground)]">v{addon.version}</span>
                      <span className="text-[11px] text-[var(--muted-foreground)]">{addon.developer}</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold text-[var(--foreground)]">
                            {addon.price === 0 ? 'Ücretsiz' : `₺${(addon.price / 100).toLocaleString('tr-TR')}`}
                          </span>
                          {addon.price > 0 && (
                             <span className="text-xs text-[var(--muted-foreground)]">/ay</span>
                           )}
                        </div>
                      </div>
                      <button
                        onClick={() => setModalAddon(addon)}
                        className="px-5 py-2.5 bg-gradient-to-r from-[var(--primary)] to-blue-500 hover:from-[var(--primary-hover)] hover:to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-[var(--primary)]/30 hover:shadow-xl hover:shadow-[var(--primary)]/40 transition-all duration-200 flex items-center gap-2"
                      >
                        <ShoppingCart size={15} /> Hemen Satın Al
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADDON GRID */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid3X3 size={16} className="text-[var(--muted-foreground)]" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {activeCategory === 'ALL' ? 'Tüm Eklentiler' : CATEGORIES.find(c => c.key === activeCategory)?.label}
              </h2>
              {searchQuery && (
                <span className="text-sm text-[var(--muted-foreground)]">
                  &quot;{searchQuery}&quot; için {filteredAddons.length} sonuç
                </span>
              )}
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">{filteredAddons.length} eklenti</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredAddons.map(addon => {
              const isPurchased = purchasedAddonIds.has(addon.id)
              const purchase = activePurchaseMap.get(addon.id)
              const isActive = purchase?.isActive ?? false
              const planBadge = addon.requiredPlan ? PLAN_BADGE[addon.requiredPlan] : null
              const isPlanIncluded = addon.includedInPlan === true
              const isLocked = !isPurchased && !isPlanIncluded && !!addon.requiredPlan

              return (
                <div
                  key={addon.id}
                  className={`group relative rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[var(--primary)]/8 hover:-translate-y-1 hover:border-[var(--primary)]/30 ${isLocked ? 'opacity-90' : ''}`}
                >
                  {addon.isFeatured && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="px-2.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-md flex items-center gap-1">
                        <Sparkles size={10} /> Öne Çıkan
                      </span>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
                        addon.isFeatured
                          ? 'bg-gradient-to-br from-[var(--primary)]/20 to-blue-500/20'
                          : 'bg-[var(--primary-light)]'
                      }`}>
                        {addon.icon || '🧩'}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {planBadge && (
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${planBadge.className}`}>
                            {isPlanIncluded ? `✓ ${planBadge.label} dahil` : `${planBadge.label}+`}
                          </span>
                        )}
                        {addon.category && (
                          <span className="px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] text-[10px] font-medium rounded-md">
                            {CATEGORY_LABELS[addon.category] || addon.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {isLocked && (
                      <div className="flex items-center gap-1.5 mb-2 text-[10px] text-amber-600 dark:text-amber-400">
                        <AlertCircle size={12} />
                        <span>Plan yükseltme veya eklenti satın alma gerekli</span>
                      </div>
                    )}

                    <h3 className="text-[15px] font-bold text-[var(--foreground)] mb-1.5 group-hover:text-[var(--primary)] transition-colors">{addon.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed line-clamp-2 mb-3">{addon.description}</p>

                    <div className="flex items-center gap-3 mb-4">
                      <StarRating rating={4} size={11} />
                      <span className="text-[10px] text-[var(--muted-foreground)]">v{addon.version}</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">{addon.developer}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap pt-4 border-t border-[var(--border)]">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-[var(--foreground)]">
                            {addon.price === 0 ? 'Ücretsiz' : `₺${(addon.price / 100).toLocaleString('tr-TR')}`}
                          </span>
                          {addon.price > 0 && (
                            <span className="text-xs text-[var(--muted-foreground)]">/{addon.purchaseType === 'YEARLY' ? 'yıl' : 'ay'}</span>
                          )}
                          {addon.isFeatured && addon.price > 0 && (
                            <span className="text-[10px] text-[var(--success)] font-medium ml-1">14 gün para iade garantisi</span>
                          )}
                        </div>
                        {addon.price > 0 && (
                          <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5 flex items-center gap-1">
                            <Check size={10} /> 14 gün para iade garantisi
                          </p>
                        )}
                      </div>

                      {isPurchased ? (
                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <span className="px-3 py-1.5 text-[11px] font-semibold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg flex items-center gap-1">
                              <Check size={12} /> Satın Alındı • Aktif
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center gap-1">
                              <AlertCircle size={12} /> Satın Alındı • Pasif
                            </span>
                          )}
                          <button
                            onClick={() => router.push(`/settings/addons/${addon.id}`)}
                            className="p-1.5 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] hover:bg-[var(--primary)]/20 transition"
                          >
                            <Settings size={14} />
                          </button>
                        </div>
                      ) : addon.price === 0 ? (
                        <button
                          onClick={() => handlePurchase(addon)}
                          disabled={purchasingId === addon.id}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-medium rounded-xl shadow-md shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {purchasingId === addon.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <><Check size={14} /> Ücretsiz</>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => setModalAddon(addon)}
                          className="px-4 py-2 bg-gradient-to-r from-[var(--primary)] to-blue-500 hover:from-[var(--primary-hover)] hover:to-blue-600 text-white text-sm font-medium rounded-xl shadow-md shadow-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/40 transition-all duration-200 flex items-center gap-1.5"
                        >
                          <ShoppingCart size={14} /> Satın Al
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredAddons.length === 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-16">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/3 to-transparent pointer-events-none" />
              <div className="relative flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-blue-500/20 flex items-center justify-center text-4xl mb-5 shadow-inner">
                  <Package size={36} className="text-[var(--primary)]/60" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">Eklenti bulunamadı</h3>
                <p className="text-sm text-[var(--muted-foreground)] max-w-md">
                  {searchQuery
                    ? `"${searchQuery}" ile eşleşen bir eklenti bulamadık. Farklı bir arama terimi deneyin.`
                    : 'Bu kategoride henüz bir eklenti bulunmuyor. Farklı bir kategori seçmeyi deneyin.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setActiveCategory('ALL') }}
                    className="mt-4 px-4 py-2 text-sm font-medium bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl hover:bg-[var(--primary)]/20 transition"
                  >
                    Tümünü Göster
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PURCHASE CONFIRMATION MODAL */}
      {modalAddon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalAddon(null)} />
          <div className="relative w-full max-w-md animate-in-scale">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden">
              <div className="relative p-6">
                <button
                  onClick={() => setModalAddon(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-[var(--primary-light)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center justify-center transition"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-blue-500/20 flex items-center justify-center text-3xl">
                    {modalAddon.icon || '🧩'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[var(--foreground)]">{modalAddon.name}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">{modalAddon.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-2 py-0.5 bg-[var(--primary-light)] text-[var(--primary)] text-[10px] font-medium rounded-md">
                        {CATEGORY_LABELS[modalAddon.category] || modalAddon.category}
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">v{modalAddon.version}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-[var(--primary)]/5 to-blue-500/5 border border-[var(--border)] p-4 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Aylık Ücret</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[var(--foreground)]">
                        {modalAddon.price === 0 ? 'Ücretsiz' : `₺${(modalAddon.price / 100).toLocaleString('tr-TR')}`}
                      </span>
                      {modalAddon.price > 0 && (
                        <span className="text-sm text-[var(--muted-foreground)]">/{modalAddon.purchaseType === 'YEARLY' ? 'yıl' : 'ay'}</span>
                      )}
                    </div>
                  </div>
                  {modalAddon.price > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--border)]">
                      <Check size={12} className="text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400">14 gün para iade garantisi</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setModalAddon(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--primary-light)] text-sm font-medium transition"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() => handlePurchase(modalAddon)}
                    disabled={purchasingId === modalAddon.id}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[var(--primary)] to-blue-500 hover:from-[var(--primary-hover)] hover:to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-[var(--primary)]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {purchasingId === modalAddon.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><ArrowRight size={16} /> Ödemeye Geç</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
