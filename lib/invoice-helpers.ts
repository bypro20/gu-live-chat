// Client-safe formatting helpers (no server-side imports)
// Used by invoice pages and billing components

import { PLANS } from './constants'
import type { PlanId } from './plan-cta'
import { getPlanEntry } from './plan-i18n'
import type { SiteLocale } from './regional-config'
import { getInvoiceStatusLabelFromSettings } from './settings-i18n'

// ─── Format Amount ─────────────────────────────────────────────────

export function formatAmount(amountInKurus: number, currency = 'TRY'): string {
  const value = amountInKurus / 100
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

// ─── Invoice Status Label (Turkish) ───────────────────────────────

export function getInvoiceStatusLabel(status: string, locale?: SiteLocale): string {
  return getInvoiceStatusLabelFromSettings(status, locale)
}

export function getInvoiceStatusColor(status: string): string {
  switch (status) {
    case 'PENDING': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'PAID': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'FAILED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'REFUNDED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

// ─── Plan Name Helper ─────────────────────────────────────────────

export function getPlanLabel(plan: string, locale?: SiteLocale): string {
  if (locale) {
    const entry = getPlanEntry(locale, plan as PlanId)
    if (entry?.name) return entry.name
  }
  const planData = PLANS.find((p) => p.id === plan)
  return planData?.name || plan
}