'use client'

import { Suspense } from 'react'
import { SessionProvider } from 'next-auth/react'
import { LocaleProvider } from '@/components/marketing/locale-provider'
import type { LocaleContext } from '@/lib/locale-server'
import { Starfield } from '@/components/marketing/home-v2/fx'

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
        <div className="dark hv2-scope hv2-auth hv2-grain relative min-h-screen overflow-hidden">
          <div className="hv2-aurora" aria-hidden="true" />
          <Starfield count={60} />
          <div className="relative z-10">
            <Suspense fallback={null}>{children}</Suspense>
          </div>
        </div>
      </LocaleProvider>
    </SessionProvider>
  )
}
