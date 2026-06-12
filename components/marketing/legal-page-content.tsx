'use client'

import { useMarketingPages } from '@/lib/hooks/use-marketing-pages'
import { LegalDocument } from '@/components/marketing/legal-document'

type LegalKey = keyof ReturnType<typeof useMarketingPages>['legal']

export function LegalPageContent({
  page,
  showPayments,
}: {
  page: LegalKey
  showPayments?: boolean
}) {
  const doc = useMarketingPages().legal[page]
  return <LegalDocument doc={doc} showPayments={showPayments} />
}
