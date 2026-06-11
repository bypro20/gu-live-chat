'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PlanId } from '@/lib/plan-cta'

export function usePlanCheckout(websiteId?: string, returnTo: 'plans' | 'billing' = 'plans') {
  const [iyzicoEnabled, setIyzicoEnabled] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutFormContent, setCheckoutFormContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/iyzico/status')
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .then((data) => setIyzicoEnabled(Boolean(data.enabled)))
      .catch(() => setIyzicoEnabled(false))
  }, [])

  const purchasePlan = useCallback(
    async (planId: PlanId) => {
      if (!websiteId) {
        setError('Önce bir site seçin.')
        return false
      }

      if (planId === 'FREE') return false

      if (!iyzicoEnabled) {
        setError('Ödeme sistemi şu an kullanılamıyor. Lütfen biraz sonra tekrar deneyin.')
        return false
      }

      setCheckoutLoading(planId)
      setError(null)

      try {
        const res = await fetch('/api/iyzico/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId, websiteId, returnTo }),
        })
        const data = await res.json()

        if (data.paymentPageUrl) {
          window.location.href = data.paymentPageUrl
          return true
        }

        if (data.checkoutFormContent) {
          setCheckoutFormContent(data.checkoutFormContent)
          return true
        }

        setError(data.error || 'Ödeme başlatılamadı')
        return false
      } catch {
        setError('Bağlantı hatası. Lütfen tekrar deneyin.')
        return false
      } finally {
        setCheckoutLoading(null)
      }
    },
    [iyzicoEnabled, websiteId, returnTo]
  )

  return {
    iyzicoEnabled,
    checkoutLoading,
    checkoutFormContent,
    setCheckoutFormContent,
    error,
    setError,
    purchasePlan,
  }
}
