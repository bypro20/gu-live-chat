'use client'

import { SessionProvider } from 'next-auth/react'
import { LocaleProvider } from '@/components/marketing/locale-provider'
import type { LocaleContext } from '@/lib/locale-server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { PanelBoot } from '@/components/panel/panel-boot'

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
        <PanelBoot />
        <DashboardShell>{children}</DashboardShell>
      </LocaleProvider>
    </SessionProvider>
  )
}
