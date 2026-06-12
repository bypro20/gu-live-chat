'use client'

import { Suspense } from 'react'
import { SessionProvider } from 'next-auth/react'
import { LocaleProvider } from '@/components/marketing/locale-provider'
import type { LocaleContext } from '@/lib/locale-server'

export function AuthShell({
  initialLocale,
  children,
}: {
  initialLocale: LocaleContext
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <LocaleProvider initial={initialLocale}>
        <Suspense fallback={null}>{children}</Suspense>
      </LocaleProvider>
    </SessionProvider>
  )
}
