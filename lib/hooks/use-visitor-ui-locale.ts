'use client'

import { usePathname } from 'next/navigation'
import { useLocale } from '@/components/marketing/locale-provider'
import type { SiteLocale } from '@/lib/regional-config'

/** Admin panel always Turkish; customer dashboard follows site locale. */
export function useVisitorUiLocale(): SiteLocale {
  const pathname = usePathname()
  const { locale } = useLocale()
  if (pathname?.startsWith('/admin')) return 'tr'
  return locale
}
