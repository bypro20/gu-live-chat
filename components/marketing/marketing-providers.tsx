'use client'

import { SessionProvider } from 'next-auth/react'
import { LocaleProvider } from '@/components/marketing/locale-provider'
import type { LocaleContext } from '@/lib/locale-server'

export function MarketingProviders({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale?: LocaleContext
}) {
  return (
    <SessionProvider>
      <LocaleProvider initial={initialLocale}>{children}</LocaleProvider>
    </SessionProvider>
  )
}
