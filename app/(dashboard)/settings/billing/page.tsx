'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { PLANS } from '@/lib/constants'
import { isPaytrEnabled } from '@/lib/paytr-client'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { formatAmount, getInvoiceStatusLabel, getInvoiceStatusColor, getPlanLabel } from '@/lib/invoice-helpers'
import PaytrFrame from './PaytrFrame'

interface SubscriptionInfo {
  plan: string
  status: string
  currentPeriodEnd: string | null
  failedPayments: number
}

interface TrialInfo {
  isTrialing: boolean
  daysLeft: number
  trialEndsAt: string | null
  trialPlan: string | null
  trialUsed: boolean
}

interface Invoice {
  id: string
  plan: string
  amount: number
  currency: string
  status: string
  periodStart: string
  periodEnd: string
  createdAt: string
}

export default function BillingPage() {
  const { data: session } = useSession()
  const { activeWebsite, isLoading: websitesLoading } = useActiveWebsite()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [paytrToken, setPaytrToken] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null) // planId being loaded
  const [cancelling, setCancelling] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const paytrEnabled = isPaytrEnabled()

  const fetchSubscription = useCallback(async () => {
    if (!activeWebsite) return
    try {
      const res = await fetch(`/api/paytr/subscription?websiteId=${activeWebsite.websiteId}`)
      if (res.ok) {
        const data = await res.json()
        setSubscription(data)
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setLoading(false)
    }
  }, [activeWebsite])

  const fetchTrialInfo = useCallback(async () => {
    if (!activeWebsite) return
    try {
      const res = await fetch(`/api/trial?websiteId=${activeWebsite.websiteId}`)
      if (res.ok) {
        const data = await res.json()
        setTrialInfo(data)
      }
    } catch {
      // Non-critical — ignore
    }
  }, [activeWebsite])

  useEffect(() => {
    if (activeWebsite) {
      fetchSubscription()
      fetchTrialInfo()
    } else if (!websitesLoading) {
      // Websites loaded but none available
      setLoading(false)
    }
  }, [activeWebsite, websitesLoading, fetchSubscription, fetchTrialInfo])

  const fetchInvoices = useCallback(async () => {
    if (!activeWebsite) return
    setInvoicesLoading(true)
    try {
      const res = await fetch(`/api/invoices?websiteId=${activeWebsite.websiteId}`)
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setInvoicesLoading(false)
    }
  }, [activeWebsite])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  // Check for payment redirect status in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    if (paymentStatus === 'success') {
      setMessage({ type: 'success', text: 'Ödeme başarıyla tamamlandı! Planınız güncelleniyor...' })
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/settings/billing')
      // Refresh subscription status
      setTimeout(() => { fetchSubscription(); fetchInvoices(); fetchTrialInfo() }, 2000)
    } else if (paymentStatus === 'failed') {
      setMessage({ type: 'error', text: 'Ödeme başarısız oldu. Lütfen tekrar deneyin.' })
      window.history.replaceState({}, '', '/dashboard/settings/billing')
    }
  }, [fetchSubscription, fetchInvoices])

  const handleUpgrade = async (planId: string) => {
    if (!paytrEnabled) {
      setMessage({ type: 'error', text: 'Ödeme sistemi henüz yapılandırılmamış. Lütfen yöneticinizle iletişime geçin.' })
      return
    }

    setCheckoutLoading(planId)
    setMessage(null)

    try {
      const res = await fetch('/api/paytr/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, websiteId: activeWebsite?.websiteId }),
      })

      const data = await res.json()

      if (data.token) {
        setPaytrToken(data.token)
      } else {
        setMessage({ type: 'error', text: data.error || 'Ödeme başlatılamadı' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Bağlantı hatası. Lütfen tekrar deneyin.' })
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Aboneliğinizi iptal etmek istediğinize emin misiniz? Planınız ücretsiz plana döndürülecektir.')) {
      return
    }

    setCancelling(true)
    setMessage(null)

    try {
      const res = await fetch('/api/paytr/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: activeWebsite?.websiteId }),
      })
      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Abonelik başarıyla iptal edildi.' })
        fetchSubscription()
      } else {
        setMessage({ type: 'error', text: data.error || 'İptal başarısız' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Bağlantı hatası' })
    } finally {
      setCancelling(false)
    }
  }

  const handlePaymentSuccess = useCallback(() => {
    setPaytrToken(null)
    setMessage({ type: 'success', text: 'Ödeme başarıyla tamamlandı! Planınız güncelleniyor...' })
    setTimeout(() => { fetchSubscription(); fetchInvoices(); fetchTrialInfo() }, 2000)
  }, [fetchSubscription, fetchInvoices, fetchTrialInfo])

  const handlePaymentFailure = useCallback((reason?: string) => {
    setPaytrToken(null)
    setMessage({ type: 'error', text: reason || 'Ödeme başarısız oldu. Lütfen tekrar deneyin.' })
  }, [])

  const currentPlan = (subscription?.plan || 'FREE') as string
  const planStatus = subscription?.status || 'NONE'

  const getStatusBadge = () => {
    switch (planStatus) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold rounded-full">Aktif</span>
      case 'PAST_DUE':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-semibold rounded-full">Ödeme Bekliyor</span>
      case 'CANCELED':
        if (trialInfo?.trialUsed && !trialInfo.isTrialing) {
          return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-semibold rounded-full">Deneme Bitti</span>
        }
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold rounded-full">İptal Edildi</span>
      case 'TRIALING':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold rounded-full">Deneme</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <>
      {paytrToken && (
        <PaytrFrame
          token={paytrToken}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onClose={() => setPaytrToken(null)}
        />
      )}

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Faturalama</h1>
          <p className="text-sm text-muted-foreground mt-1">Planınızı yönetin ve fatura bilgilerinizi görüntüleyin</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
              : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Current Plan */}
        <div className="surface p-5 sm:p-6 mb-8">
          {/* Trial Banner */}
          {planStatus === 'TRIALING' && (trialInfo?.trialEndsAt || trialInfo?.daysLeft !== undefined) && (
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/10 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">PRO Plan Deneme Süresi Aktif</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    Deneme sürenizin dolmasına <strong>{trialInfo?.daysLeft ?? 0} gün</strong> kaldı
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Start Trial Banner (for FREE users who haven't used trial) */}
          {currentPlan === 'FREE' && planStatus !== 'TRIALING' && !trialInfo?.trialUsed && (
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">14 Gün Ücretsiz PRO Deneyin</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Tüm PRO özelliklerini 14 gün boyunca ücretsiz kullanın
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!activeWebsite) return
                    try {
                      const res = await fetch('/api/trial', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ websiteId: activeWebsite.websiteId }),
                      })
                      const data = await res.json()
                      if (res.ok) {
                        setMessage({ type: 'success', text: 'PRO deneme süresi başlatıldı!' })
                        fetchSubscription()
                        fetchTrialInfo()
                      } else {
                        setMessage({ type: 'error', text: data.error || 'Deneme başlatılamadı' })
                      }
                    } catch {
                      setMessage({ type: 'error', text: 'Bağlantı hatası' })
                    }
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition"
                >
                  Denemeyi Başlat
                </button>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                <h2 className="text-lg font-semibold text-foreground">Mevcut Planınız</h2>
                <span className="px-3 py-1 bg-primary-light text-primary text-xs font-semibold rounded-full">
                  {PLANS.find(p => p.id === currentPlan)?.name || 'Ücretsiz'}
                </span>
                {getStatusBadge()}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {PLANS.find(p => p.id === currentPlan)?.features.slice(0, 3).join(' • ') || 'Temel özellikler'}
              </p>
              {subscription?.currentPeriodEnd && planStatus === 'ACTIVE' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Yenileme tarihi: {new Date(subscription.currentPeriodEnd).toLocaleDateString('tr-TR')}
                </p>
              )}
              {planStatus === 'PAST_DUE' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ Ödeme alınamadı. Lütfen ödeme bilgilerinizi güncelleyin.
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                ₺{PLANS.find(p => p.id === currentPlan)?.price || 0}
              </p>
              <p className="text-sm text-muted-foreground">/ay</p>
            </div>
          </div>

          {currentPlan !== 'FREE' && planStatus === 'ACTIVE' && (
            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition disabled:opacity-50"
              >
                {cancelling ? 'İptal ediliyor...' : 'Aboneliği İptal Et'}
              </button>
            </div>
          )}
        </div>

        {/* Plans */}
        <h2 className="text-lg font-semibold text-foreground mb-4">Plan Yükseltme</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`surface p-5 !border-2 transition ${
                plan.id === currentPlan
                  ? '!border-primary bg-primary/5'
                  : plan.id === 'PRO'
                  ? '!border-primary/30 hover:!border-primary/60'
                  : 'hover:!border-primary/30'
              }`}
            >
              {plan.id === 'PRO' && (
                <span className="inline-block px-2 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-2">
                  Popüler
                </span>
              )}
              <h3 className="font-bold text-foreground">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-2xl font-bold text-foreground">₺{plan.price}</span>
                {plan.price > 0 && <span className="text-muted-foreground text-sm">/ay</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              <ul className="mt-4 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs text-foreground flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  if (!paytrEnabled) {
                    setMessage({ type: 'error', text: 'Ödeme sistemi henüz aktif değil. PayTR API bilgileri girildiğinde ödeme yapabileceksiniz.' })
                    return
                  }
                  if (plan.price > 0 && plan.id !== currentPlan) {
                    handleUpgrade(plan.id)
                  }
                }}
                disabled={plan.id === currentPlan || checkoutLoading !== null}
                className={`w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  plan.id === currentPlan
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : !paytrEnabled
                    ? 'bg-primary text-primary-foreground opacity-60 cursor-pointer hover:opacity-80'
                    : checkoutLoading === plan.id
                    ? 'bg-primary/70 text-primary-foreground cursor-wait'
                    : 'bg-primary hover:bg-primary-hover text-primary-foreground shadow-brand hover:shadow-brand-lg hover:scale-[1.02]'
                }`}
              >
                {plan.id === currentPlan
                  ? '✓ Mevcut Plan'
                  : !paytrEnabled
                  ? 'Yakında'
                  : checkoutLoading === plan.id
                  ? 'Yönlendiriliyor...'
                  : '🚀 Yükselt'}
              </button>
            </div>
          ))}
        </div>

        {/* PayTR Disabled Notice */}
        {!paytrEnabled && (
          <div className="mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Ödeme sistemi yapılandırılmamış</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  PayTR API bilgileri henüz girilmemiş. Yöneticinizle iletişime geçin veya <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env</code> dosyasında PayTR ayarlarını yapılandırın.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Billing History */}
        <div className="mt-8 surface p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Fatura Geçmişi</h3>
            <Link
              href="/settings/billing/invoices"
              className="text-sm text-primary hover:text-primary-hover font-medium transition"
            >
              Tümünü Gör →
            </Link>
          </div>
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <svg className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Henüz fatura bulunmuyor</p>
              <p className="text-sm mt-1 text-muted-foreground/70">Ücretli bir plana geçtiğinizde faturalar burada görünecek</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      #{invoice.id.slice(-8).toUpperCase()} · {getPlanLabel(invoice.plan)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-foreground">
                      {formatAmount(invoice.amount, invoice.currency)}
                    </span>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getInvoiceStatusColor(invoice.status)}`}>
                      {getInvoiceStatusLabel(invoice.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}