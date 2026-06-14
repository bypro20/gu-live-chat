'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { PLANS } from '@/lib/constants'
import type { PlanId } from '@/lib/plan-cta'
import { getPlanEntry } from '@/lib/plan-i18n'
import { PlanPackagesPanel } from '@/components/dashboard/plan-packages-panel'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { useSettingsI18n } from '@/lib/hooks/use-settings-i18n'
import { formatAmount, getInvoiceStatusLabel, getInvoiceStatusColor, getPlanLabel } from '@/lib/invoice-helpers'
import IyzicoCheckout from './IyzicoCheckout'
import { PaymentLogos } from '@/components/marketing/payment-logos'
import {
  TRIAL_BONUS_FIRST_CHAT_DAYS,
  TRIAL_BONUS_WIDGET_DAYS,
  TRIAL_DAYS,
} from '@/lib/trial-config'
import { trackPurchase } from '@/lib/marketing-events'

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
  bonusWidgetGranted?: boolean
  bonusChatGranted?: boolean
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
  const i18n = useSettingsI18n()
  const { billing: b, common: c } = i18n
  const { data: session } = useSession()
  const { activeWebsite, isLoading: websitesLoading } = useActiveWebsite()
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [checkoutFormContent, setCheckoutFormContent] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null) // planId being loaded
  const [cancelling, setCancelling] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [iyzicoEnabled, setIyzicoEnabled] = useState(false)
  const [trialStarting, setTrialStarting] = useState(false)
  const [canStartTrialImmediately, setCanStartTrialImmediately] = useState(false)

  useEffect(() => {
    fetch('/api/iyzico/status')
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .then((data) => setIyzicoEnabled(Boolean(data.enabled)))
      .catch(() => setIyzicoEnabled(false))
  }, [])

  const fetchSubscription = useCallback(async () => {
    if (!activeWebsite) return
    try {
      const res = await fetch(`/api/iyzico/subscription?websiteId=${activeWebsite.websiteId}`)
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
        setCanStartTrialImmediately(Boolean(data.canStartImmediately))
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
      const trialStarted = params.get('trial') === '1'
      setMessage({
        type: 'success',
        text: trialStarted ? b.trialStarted : b.paymentSuccess,
      })
      trackPurchase({ currency: 'TRY' })
      // Clean URL
      window.history.replaceState({}, '', '/settings/billing')
      // Refresh subscription status
      setTimeout(() => { fetchSubscription(); fetchInvoices(); fetchTrialInfo() }, 2000)
    } else if (paymentStatus === 'failed') {
      setMessage({ type: 'error', text: b.paymentFailed })
      window.history.replaceState({}, '', '/settings/billing')
    }
  }, [fetchSubscription, fetchInvoices, fetchTrialInfo])

  const handleUpgrade = async (planId: string) => {
    if (!iyzicoEnabled) {
      setMessage({ type: 'error', text: b.paymentNotConfigured })
      return
    }

    setCheckoutLoading(planId)
    setMessage(null)

    try {
      const res = await fetch('/api/iyzico/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, websiteId: activeWebsite?.websiteId, returnTo: 'billing' }),
      })

      const data = await res.json()

      if (data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl
        return
      }

      if (data.checkoutFormContent) {
        setCheckoutFormContent(data.checkoutFormContent)
      } else {
        setMessage({ type: 'error', text: data.error || b.paymentStartFailed })
      }
    } catch {
      setMessage({ type: 'error', text: c.connectionError })
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleCancel = async () => {
    if (!confirm(b.cancelConfirm)) {
      return
    }

    setCancelling(true)
    setMessage(null)

    try {
      const res = await fetch('/api/iyzico/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: activeWebsite?.websiteId }),
      })
      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: b.cancelSuccess })
        fetchSubscription()
      } else {
        setMessage({ type: 'error', text: data.error || b.cancelFailed })
      }
    } catch {
      setMessage({ type: 'error', text: c.connectionError })
    } finally {
      setCancelling(false)
    }
  }

  const currentPlan = (subscription?.plan || 'FREE') as PlanId
  const planStatus = subscription?.status || 'NONE'

  const startTrial = async () => {
    if (!activeWebsite) return
    if (!iyzicoEnabled && !canStartTrialImmediately) {
      setMessage({ type: 'error', text: b.paymentNotConfigured })
      return
    }

    setTrialStarting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: activeWebsite.websiteId }),
      })
      const data = await res.json()

      if (data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl
        return
      }

      if (data.checkoutFormContent) {
        setCheckoutFormContent(data.checkoutFormContent)
        return
      }

      if (res.ok && data.started) {
        setMessage({ type: 'success', text: b.trialStarted })
        fetchSubscription()
        fetchTrialInfo()
      } else {
        setMessage({ type: 'error', text: data.error || b.trialStartFailed })
      }
    } catch {
      setMessage({ type: 'error', text: c.connectionError })
    } finally {
      setTrialStarting(false)
    }
  }

  const handlePlanAction = async (planId: PlanId) => {
    if (planId === currentPlan || planId === 'FREE') return
    await handleUpgrade(planId)
  }

  // Deep link: /settings/billing?plan=PRO → paketler sayfasına yönlendir
  useEffect(() => {
    if (!activeWebsite || loading) return
    const params = new URLSearchParams(window.location.search)
    const targetPlan = params.get('plan') as PlanId | null
    if (!targetPlan || !['STARTER', 'PRO', 'BUSINESS'].includes(targetPlan)) return

    window.location.replace(`/settings/plans?plan=${targetPlan}`)
  }, [activeWebsite, loading])

  const getStatusBadge = () => {
    switch (planStatus) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold rounded-full">{b.statusActive}</span>
      case 'PAST_DUE':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-semibold rounded-full">{b.statusPastDue}</span>
      case 'CANCELED':
        if (trialInfo?.trialUsed && !trialInfo.isTrialing) {
          return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-semibold rounded-full">{b.statusTrialEnded}</span>
        }
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold rounded-full">{b.statusCanceled}</span>
      case 'TRIALING':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold rounded-full">{b.statusTrialing}</span>
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
      {checkoutFormContent && (
        <IyzicoCheckout
          checkoutFormContent={checkoutFormContent}
          onClose={() => setCheckoutFormContent(null)}
        />
      )}

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{b.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{b.subtitle}</p>
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
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{b.trialActive}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    {b.trialDaysLeft(trialInfo?.daysLeft ?? 0)}
                    {!trialInfo?.bonusWidgetGranted && b.trialBonusWidget(TRIAL_BONUS_WIDGET_DAYS)}
                    {!trialInfo?.bonusChatGranted && b.trialBonusChat(TRIAL_BONUS_FIRST_CHAT_DAYS)}
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
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {b.trialBillingTitle(TRIAL_DAYS)}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {b.trialBillingSubtitle(TRIAL_DAYS, TRIAL_BONUS_WIDGET_DAYS, TRIAL_BONUS_FIRST_CHAT_DAYS)}
                  </p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                    {b.trialCardHint}
                  </p>
                </div>
                <button
                  onClick={() => void startTrial()}
                  disabled={trialStarting || (!iyzicoEnabled && !canStartTrialImmediately)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition"
                >
                  {trialStarting ? b.startingTrial : b.startTrial}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                <h2 className="text-lg font-semibold text-foreground">{b.currentPlan}</h2>
                <span className="px-3 py-1 bg-primary-light text-primary text-xs font-semibold rounded-full">
                  {getPlanEntry(i18n.locale, currentPlan).name || b.freePlan}
                </span>
                {getStatusBadge()}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {getPlanEntry(i18n.locale, currentPlan).features.slice(0, 3).join(' • ') || b.basicFeatures}
              </p>
              {subscription?.currentPeriodEnd && planStatus === 'ACTIVE' && (
                <p className="text-xs text-muted-foreground mt-1">
                  {b.renewalDate(new Date(subscription.currentPeriodEnd).toLocaleDateString(i18n.dateLocale))}
                  {currentPlan !== 'FREE' && b.autoCharge}
                </p>
              )}
              {planStatus === 'PAST_DUE' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {b.pastDueWarning}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                ₺{PLANS.find(p => p.id === currentPlan)?.price || 0}
              </p>
              <p className="text-sm text-muted-foreground">{b.perMonth}</p>
            </div>
          </div>

          {currentPlan !== 'FREE' && planStatus === 'ACTIVE' && (
            <div className="mt-4 pt-4 border-t border-border">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition disabled:opacity-50"
              >
                {cancelling ? b.cancelling : b.cancelSubscription}
              </button>
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{b.planUpgrade}</h2>
            <p className="text-sm text-muted-foreground mt-1">{b.planUpgradeHint}</p>
          </div>
          <Link
            href="/settings/plans"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover transition"
          >
            {b.viewPlans}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
        <PlanPackagesPanel
          currentPlan={currentPlan}
          iyzicoEnabled={iyzicoEnabled}
          checkoutLoading={checkoutLoading}
          onPurchase={(planId) => void handlePlanAction(planId)}
          compact
        />

        {/* Enterprise contact */}
        <div className="mt-6 rounded-2xl border-2 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/30 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">{b.enterprise}</span>
              <h3 className="mt-2 text-lg font-bold text-foreground">{b.enterpriseTitle}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.enterpriseDesc}</p>
              <ul className="mt-4 space-y-1.5">
                {b.enterpriseFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <svg className="w-4 h-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/contact"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-base font-bold px-8 py-3.5 rounded-xl transition-colors shadow-brand hover:shadow-brand-lg"
            >
              {b.contactUs}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* iyzico Disabled Notice */}
        {!iyzicoEnabled && (
          <div className="mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{b.paymentDisabledTitle}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{b.paymentDisabledDesc}</p>
              </div>
            </div>
          </div>
        )}

        {/* Billing History */}
        <div className="mt-8 surface p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">{b.invoiceHistory}</h3>
            <Link
              href="/settings/billing/invoices"
              className="text-sm text-primary hover:text-primary-hover font-medium transition"
            >
              {b.viewAll}
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
              <p>{b.noInvoices}</p>
              <p className="text-sm mt-1 text-muted-foreground/70">{b.noInvoicesHint}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      #{invoice.id.slice(-8).toUpperCase()} · {getPlanLabel(invoice.plan, i18n.locale)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(invoice.createdAt).toLocaleDateString(i18n.dateLocale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-foreground">
                      {formatAmount(invoice.amount, invoice.currency)}
                    </span>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getInvoiceStatusColor(invoice.status)}`}>
                      {getInvoiceStatusLabel(invoice.status, i18n.locale)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 pt-8 border-t border-border">
          <PaymentLogos variant="checkout" />
        </div>
      </div>
    </>
  )
}