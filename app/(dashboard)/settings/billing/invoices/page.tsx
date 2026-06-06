'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { formatAmount, getInvoiceStatusLabel, getInvoiceStatusColor, getPlanLabel } from '@/lib/invoice-helpers'

interface Invoice {
  id: string
  plan: string
  amount: number
  currency: string
  status: string
  periodStart: string
  periodEnd: string
  paytrMerchantOid: string | null
  pdfUrl: string | null
  createdAt: string
  updatedAt: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function InvoicesPage() {
  const { activeWebsite, isLoading: websiteLoading } = useActiveWebsite()
  const { data, error, isLoading } = useSWR<{ invoices: Invoice[] }>(
    activeWebsite ? `/api/invoices?websiteId=${activeWebsite.websiteId}` : null,
    fetcher
  )

  if (websiteLoading || isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    )
  }

  const invoices = data?.invoices || []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings/billing"
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fatura Geçmişi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeWebsite?.name || 'Site'} faturaları
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      {invoices.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1d2e] rounded-xl border border-[#E5E7EB] dark:border-gray-700 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">Henüz fatura bulunmuyor</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Bir ödeme yaptığınızda faturalar burada görünecek</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1a1d2e] rounded-xl border border-[#E5E7EB] dark:border-gray-700 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-gray-700">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fatura</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dönem</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tutar</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-700">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-[#EFF6FF] dark:hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        #{invoice.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {getPlanLabel(invoice.plan)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(invoice.periodStart).toLocaleDateString('tr-TR')} — {new Date(invoice.periodEnd).toLocaleDateString('tr-TR')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatAmount(invoice.amount, invoice.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getInvoiceStatusColor(invoice.status)}`}>
                        {getInvoiceStatusLabel(invoice.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[#E5E7EB] dark:divide-gray-700">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    #{invoice.id.slice(-8).toUpperCase()}
                  </p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getInvoiceStatusColor(invoice.status)}`}>
                    {getInvoiceStatusLabel(invoice.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{new Date(invoice.createdAt).toLocaleDateString('tr-TR')}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{getPlanLabel(invoice.plan)}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatAmount(invoice.amount, invoice.currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}