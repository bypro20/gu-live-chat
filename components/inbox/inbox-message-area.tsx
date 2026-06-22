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
        'flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-smooth px-4 py-4',
        'bg-[#F4F6FA]',
        '[background-image:radial-gradient(rgba(15,23,42,0.04)_1px,transparent_1px)]',
        '[background-size:24px_24px]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
