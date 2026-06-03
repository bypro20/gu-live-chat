import { prisma } from './db'
import { Plan, InvoiceStatus } from '../app/generated/prisma/client'
import { PLANS } from './constants'

// ─── Types ────────────────────────────────────────────────────────

interface CreateInvoiceParams {
  websiteId: string
  plan: Plan
  amount: number // in kuruş (cents)
  currency?: string
  periodStart: Date
  periodEnd: Date
  paytrMerchantOid?: string
}

// ─── Create Invoice ────────────────────────────────────────────────

export async function createInvoice(params: CreateInvoiceParams) {
  return prisma.invoice.create({
    data: {
      websiteId: params.websiteId,
      plan: params.plan,
      amount: params.amount,
      currency: params.currency || 'TRY',
      status: InvoiceStatus.PENDING,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      paytrMerchantOid: params.paytrMerchantOid,
    },
  })
}

// ─── Mark Invoice as Paid ──────────────────────────────────────────

export async function markInvoicePaid(invoiceId: string, paytrMerchantOid?: string) {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: InvoiceStatus.PAID,
      paytrMerchantOid: paytrMerchantOid || undefined,
    },
  })
}

// ─── Mark Invoice as Failed ───────────────────────────────────────

export async function markInvoiceFailed(invoiceId: string) {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: InvoiceStatus.FAILED },
  })
}

// ─── Refund Invoice ───────────────────────────────────────────────

export async function refundInvoice(invoiceId: string) {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: InvoiceStatus.REFUNDED },
  })
}

// ─── Get Invoices for Website ──────────────────────────────────────

export async function getWebsiteInvoices(websiteId: string) {
  return prisma.invoice.findMany({
    where: { websiteId },
    orderBy: { createdAt: 'desc' },
  })
}

// ─── Get or Create Invoice for Billing Period ─────────────────────

export async function getOrCreateInvoice(
  websiteId: string,
  plan: Plan,
  periodStart: Date,
  periodEnd: Date,
  paytrMerchantOid?: string
) {
  // Check if invoice already exists for this period
  const existing = await prisma.invoice.findFirst({
    where: {
      websiteId,
      periodStart: { gte: periodStart },
      periodEnd: { lte: periodEnd },
    },
  })

  if (existing) return existing

  const planData = PLANS.find((p) => p.id === plan)
  const amount = (planData?.price || 0) * 100 // Convert to kuruş

  return createInvoice({
    websiteId,
    plan,
    amount,
    periodStart,
    periodEnd,
    paytrMerchantOid,
  })
}

// ─── Format Amount ─────────────────────────────────────────────────

export function formatAmount(amountInKurus: number, currency = 'TRY'): string {
  const value = amountInKurus / 100
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

// ─── Invoice Status Label (Turkish) ──────────────────────────────

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case 'PENDING': return 'Bekliyor'
    case 'PAID': return 'Ödendi'
    case 'FAILED': return 'Başarısız'
    case 'REFUNDED': return 'İade Edildi'
    default: return status
  }
}

export function getInvoiceStatusColor(status: InvoiceStatus): string {
  switch (status) {
    case 'PENDING': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'PAID': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'FAILED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'REFUNDED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

// ─── Plan Name Helper ─────────────────────────────────────────────

export function getPlanLabel(plan: Plan): string {
  const planData = PLANS.find((p) => p.id === plan)
  return planData?.name || plan
}