'use client'

import Link from 'next/link'
import { getBillingPlanCta, type PlanId } from '@/lib/plan-cta'
import { getPlanEntry, getPlansPanelUi } from '@/lib/plan-i18n'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import { PlanPricingCard } from '@/components/marketing/plan-pricing-card'
import { trialPricingCta } from '@/lib/trial-config'
import { useRegionalPricing } from '@/lib/hooks/use-regional-pricing'
import { PLANS } from '@/lib/constants'

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
  const { planPrice, locale } = useRegionalPricing()
  const ui = getPlansPanelUi(locale)

  const handleClick = (planId: PlanId) => {
    if (planId === currentPlan || planId === 'FREE') return
    const { amount } = planPrice(planId)
    if (amount > 0) onPurchase(planId)
  }

  return (
    <div>
      {!compact && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {locale === 'en' ? 'Start with a 7-day PRO trial on signup.' : trialPricingCta()}
          </p>
          <p className="text-xs text-muted-foreground mt-2">{ui.trialNote}</p>
        </div>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${compact ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-4`}>
        {PLANS.map((plan) => {
          const planId = plan.id as PlanId
          const catalog = getPlanEntry(locale, planId)
          const isCurrent = planId === currentPlan
          const { amount, formatted } = planPrice(planId)
          const isPaid = amount > 0
          const loading = checkoutLoading === planId

          let ctaLabel = getBillingPlanCta(planId, { isCurrentPlan: isCurrent, locale })
          if (loading) ctaLabel = ui.redirecting
          else if (isPaid && !isCurrent && iyzicoEnabled) ctaLabel = ui.buyNowCheckout
          else if (planId === 'FREE' && !isCurrent) ctaLabel = ui.freePlan

          return (
            <PlanPricingCard
              key={plan.id}
              tier={planId}
              name={catalog.name}
              description={catalog.description}
              highlighted={plan.id === 'PRO' && !isCurrent}
              current={isCurrent}
              currentLabel={ui.currentPlanLabel}
              badge={plan.id === 'PRO' && !isCurrent ? ui.popular : null}
              maxFeatures={compact ? 5 : undefined}
              price={
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight">
                    {amount === 0 ? ui.free : formatted}
                  </span>
                  {amount > 0 && (
                    <span className="text-muted-foreground text-sm font-medium">{ui.perMonth}</span>
                  )}
                </div>
              }
              features={catalog.features}
              cta={
                planId === 'BUSINESS' && !isCurrent ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleClick(planId)}
                      disabled={loading || !iyzicoEnabled}
                      className="w-full py-3 rounded-xl text-sm font-bold bg-primary hover:bg-primary-hover text-primary-foreground transition disabled:opacity-60"
                    >
                      {loading ? ui.redirecting : ui.buyNowCheckout}
                    </button>
                    <Link
                      href="/contact?konu=kurumsal"
                      className="block w-full py-2.5 rounded-xl text-xs font-semibold text-center border border-border hover:bg-muted transition"
                    >
                      {ui.enterpriseOffer}
                    </Link>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleClick(planId)}
                    disabled={isCurrent || planId === 'FREE' || loading || (isPaid && !iyzicoEnabled)}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                      isCurrent || planId === 'FREE'
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : !iyzicoEnabled
                          ? 'bg-primary text-primary-foreground opacity-60 cursor-not-allowed'
                          : loading
                            ? 'bg-primary/70 text-primary-foreground cursor-wait'
                            : 'bg-primary hover:bg-primary-hover text-primary-foreground shadow-brand hover:shadow-brand-lg'
                    }`}
                  >
                    {ctaLabel}
                  </button>
                )
              }
            />
          )
        })}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PaymentLogos variant="checkout" />
        <p className="text-[11px] text-muted-foreground">
          {ui.paymentNote}{' '}
          <Link href="/settings/billing" className="text-primary hover:underline">
            {ui.billingLink}
          </Link>
        </p>
      </div>
    </div>
  )
}
