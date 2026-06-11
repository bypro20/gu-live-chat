'use client'

import Link from 'next/link'
import { PLANS } from '@/lib/constants'
import { getBillingPlanCta, type PlanId } from '@/lib/plan-cta'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { trialPricingCta } from '@/lib/trial-config'

interface PlanPackagesPanelProps {
  currentPlan: PlanId
  iyzicoEnabled: boolean
  checkoutLoading: string | null
  onPurchase: (planId: PlanId) => void
  compact?: boolean
}

export function PlanPackagesPanel({
  currentPlan,
  iyzicoEnabled,
  checkoutLoading,
  onPurchase,
  compact = false,
}: PlanPackagesPanelProps) {
  const handleClick = (planId: PlanId, price: number) => {
    if (planId === currentPlan || planId === 'FREE') return
    if (price > 0) {
      onPurchase(planId)
    }
  }

  return (
    <div>
      {!compact && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">{trialPricingCta()}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Ücretli paketlerde güvenli ödeme ekranına yönlendirilirsiniz. İlk ödemede kartınız kaydedilir;
            abonelik aylık otomatik yenilenir.
          </p>
        </div>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${compact ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4`}>
        {PLANS.map((plan) => {
          const planId = plan.id as PlanId
          const isCurrent = planId === currentPlan
          const isPaid = plan.price > 0
          const loading = checkoutLoading === planId

          let ctaLabel = getBillingPlanCta(planId, { isCurrentPlan: isCurrent })
          if (loading) ctaLabel = 'Ödemeye yönlendiriliyor...'
          else if (isPaid && !isCurrent && iyzicoEnabled) ctaLabel = 'Satın Al — Ödemeye Git'
          else if (planId === 'FREE' && !isCurrent) ctaLabel = 'Ücretsiz Plan'

          return (
            <article
              key={plan.id}
              className={`surface p-5 !border-2 transition flex flex-col h-full ${
                isCurrent
                  ? '!border-primary bg-primary/5 ring-1 ring-primary/20'
                  : plan.id === 'PRO'
                    ? '!border-primary/30 hover:!border-primary/60'
                    : 'hover:!border-primary/30'
              }`}
            >
              {isCurrent && (
                <span className="inline-block px-2 py-0.5 bg-primary/15 text-primary text-[10px] font-bold rounded-full mb-2 uppercase tracking-wide">
                  Mevcut paketiniz
                </span>
              )}
              {plan.id === 'PRO' && !isCurrent && (
                <span className="inline-block px-2 py-0.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full mb-2">
                  En popüler
                </span>
              )}
              <h3 className="font-bold text-foreground text-lg">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-2xl font-bold text-foreground">
                  {plan.price === 0 ? 'Ücretsiz' : `₺${plan.price.toLocaleString('tr-TR')}`}
                </span>
                {plan.price > 0 && <span className="text-muted-foreground text-sm">/ay</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              <ul className="mt-4 space-y-1.5 flex-1">
                {plan.features.slice(0, compact ? 5 : plan.features.length).map((f) => (
                  <li key={f} className="text-xs text-foreground flex items-start gap-1.5">
                    <svg className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {planId === 'BUSINESS' && !isCurrent ? (
                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleClick(planId, plan.price)}
                    disabled={loading || !iyzicoEnabled}
                    className="w-full py-3.5 rounded-xl text-sm font-bold bg-primary hover:bg-primary-hover text-primary-foreground transition disabled:opacity-60"
                  >
                    {loading ? 'Yönlendiriliyor...' : 'Satın Al — Ödemeye Git'}
                  </button>
                  <Link
                    href="/contact?konu=kurumsal"
                    className="block w-full py-2.5 rounded-xl text-xs font-semibold text-center border border-border hover:bg-muted transition"
                  >
                    Kurumsal teklif iste
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleClick(planId, plan.price)}
                  disabled={isCurrent || planId === 'FREE' || loading || (isPaid && !iyzicoEnabled)}
                  className={`w-full mt-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isCurrent || planId === 'FREE'
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : !iyzicoEnabled
                        ? 'bg-primary text-primary-foreground opacity-60 cursor-not-allowed'
                        : loading
                          ? 'bg-primary/70 text-primary-foreground cursor-wait'
                          : 'bg-primary hover:bg-primary-hover text-primary-foreground shadow-brand hover:shadow-brand-lg hover:scale-[1.02]'
                  }`}
                >
                  {ctaLabel}
                </button>
              )}
            </article>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PaymentLogos variant="checkout" />
        <p className="text-[11px] text-muted-foreground">
          KDV dahil · Anında dijital teslimat ·{' '}
          <Link href="/settings/billing" className="text-primary hover:underline">
            Faturalarım
          </Link>
        </p>
      </div>
    </div>
  )
}
