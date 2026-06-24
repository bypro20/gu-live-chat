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
        'inbox-message-area flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-smooth px-4 py-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
