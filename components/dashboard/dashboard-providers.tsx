'use client'

import { SessionProvider } from 'next-auth/react'
import { LocaleProvider } from '@/components/marketing/locale-provider'
import type { LocaleContext } from '@/lib/locale-server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export function DashboardProviders({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale?: LocaleContext
}) {
  return (
    <SessionProvider>
      <LocaleProvider initial={initialLocale}>
        <DashboardShell>{children}</DashboardShell>
      </LocaleProvider>
    </SessionProvider>
  )
}
