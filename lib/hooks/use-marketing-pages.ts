'use client'

import { useMemo } from 'react'
import { useLocale } from '@/components/marketing/locale-provider'
import { getMarketingPages } from '@/lib/marketing-pages'

export function useMarketingPages() {
  const { locale } = useLocale()
  return useMemo(() => getMarketingPages(locale), [locale])
}
