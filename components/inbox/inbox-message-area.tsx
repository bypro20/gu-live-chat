'use client'

import { cn } from '@/lib/utils'

/** Dot-pattern message background — matches widget .gw-dot-bg */
export function InboxMessageArea({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto px-4 py-4 scroll-smooth',
        'bg-[#EEF2FF]',
        '[background-image:radial-gradient(rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(238,242,255,0.25)_100%)]',
        '[background-size:20px_20px,100%_100%]',
        className
      )}
    >
      {children}
    </div>
  )
}
