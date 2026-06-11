'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { usePlanCheckout } from '@/lib/hooks/use-plan-checkout'
import { PlanPackagesPanel } from '@/components/dashboard/plan-packages-panel'
import IyzicoCheckout from '../billing/IyzicoCheckout'
import type { PlanId } from '@/lib/plan-cta'
import { trialHeroLine } from '@/lib/trial-config'

export default function PlansPageContent() {
  const searchParams = useSearchParams()
  const { activeWebsite, isLoading: websitesLoading } = useActiveWebsite()
  const [currentPlan, setCurrentPlan] = useState<PlanId>('FREE')
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    iyzicoEnabled,
    checkoutLoading,
    checkoutFormContent,
    setCheckoutFormContent,
    error,
    setError,
    purchasePlan,
  } = usePlanCheckout(activeWebsite?.websiteId)

  const fetchPlan = useCallback(async () => {
    if (!activeWebsite) return
    try {
      const res = await fetch(`/api/iyzico/subscription?websiteId=${activeWebsite.websiteId}`)
      if (res.ok) {
        const data = await res.json()
        setCurrentPlan((data.plan || 'FREE') as PlanId)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [activeWebsite])

  useEffect(() => {
    if (activeWebsite) fetchPlan()
    else if (!websitesLoading) setLoading(false)
  }, [activeWebsite, websitesLoading, fetchPlan])

  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success') {
      setNotice({ type: 'success', text: 'Ödeme başarılı! Paketiniz güncellendi.' })
      window.history.replaceState({}, '', '/settings/plans')
      void fetchPlan()
    } else if (payment === 'failed') {
      setNotice({ type: 'error', text: 'Ödeme tamamlanamadı. Tekrar deneyebilirsiniz.' })
      window.history.replaceState({}, '', '/settings/plans')
    }
  }, [searchParams, fetchPlan])

  useEffect(() => {
    if (!activeWebsite || loading) return
    const target = searchParams.get('plan') as PlanId | null
    if (!target || !['STARTER', 'PRO', 'BUSINESS'].includes(target)) return
    if (target === currentPlan) return

    window.history.replaceState({}, '', '/settings/plans')
    void purchasePlan(target)
  }, [activeWebsite, loading, searchParams, currentPlan, purchasePlan])

  useEffect(() => {
    if (error) setNotice({ type: 'error', text: error })
  }, [error])

  if (loading || websitesLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl flex items-center justify-center h-64">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {checkoutFormContent && (
        <IyzicoCheckout
          checkoutFormContent={checkoutFormContent}
          onClose={() => setCheckoutFormContent(null)}
        />
      )}

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Paketler</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Abonelik paketinizi seçin — ücretli paketlerde doğrudan güvenli ödeme ekranına yönlendirilirsiniz.
              </p>
              <p className="text-xs text-primary font-medium mt-2">{trialHeroLine()}</p>
            </div>
            <Link
              href="/settings/billing"
              className="text-sm font-semibold text-primary hover:underline shrink-0"
            >
              Faturalama →
            </Link>
          </div>
        </div>

        {notice && (
          <div
            className={`mb-6 p-4 rounded-xl border text-sm ${
              notice.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
                : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{notice.text}</span>
              <button
                type="button"
                onClick={() => {
                  setNotice(null)
                  setError(null)
                }}
                className="text-xs opacity-70 hover:opacity-100"
              >
                Kapat
              </button>
            </div>
          </div>
        )}

        {!iyzicoEnabled && (
          <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 text-sm text-amber-800 dark:text-amber-300">
            Ödeme sistemi geçici olarak kullanılamıyor. Birkaç dakika sonra tekrar deneyin.
          </div>
        )}

        <PlanPackagesPanel
          currentPlan={currentPlan}
          iyzicoEnabled={iyzicoEnabled}
          checkoutLoading={checkoutLoading}
          onPurchase={(planId) => void purchasePlan(planId)}
        />
      </div>
    </>
  )
}
