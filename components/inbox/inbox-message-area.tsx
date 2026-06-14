'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/** Dot-pattern message background — scroll sadece bu konteyner içinde kalır. */
export const InboxMessageArea = forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & { onAreaScroll?: () => void }
>(function InboxMessageArea({ children, className, onAreaScroll, onScroll, ...props }, ref) {
  return (
    <div
      ref={ref}
      onScroll={(e) => {
        onScroll?.(e)
        onAreaScroll?.()
      }}
      className={cn(
        'flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 py-4',
        'bg-[#EEF2FF]',
        '[background-image:radial-gradient(rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(238,242,255,0.25)_100%)]',
        '[background-size:20px_20px,100%_100%]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
