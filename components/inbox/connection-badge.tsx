'use client'

import { Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'

export function ConnectionBadge({
  connected,
  socketEnabled,
}: {
  connected: boolean
  socketEnabled: boolean
}) {
  const i = useDashboardI18n().inbox
  const label = connected ? i.live : socketEnabled ? i.connecting : i.sync

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium',
        connected
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
      )}
    >
      {connected ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <WifiOff className="w-3 h-3" />
      )}
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
        )}
      />
      {label}
    </span>
  )
}
