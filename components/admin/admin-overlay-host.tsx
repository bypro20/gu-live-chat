'use client'

import { useAdminTheme } from '@/components/admin/admin-theme-toggle'
import { cn } from '@/lib/utils'

interface AdminOverlayHostProps {
  children: React.ReactNode
  className?: string
  /** fixed modal / drawer root */
  fixed?: boolean
}

/** Portal ve fixed katmanlar admin-shell dışında tema değişkenlerini alsın */
export function AdminOverlayHost({ children, className, fixed }: AdminOverlayHostProps) {
  const { theme } = useAdminTheme()

  return (
    <div
      className={cn('admin-overlay-host', fixed && 'fixed inset-0 z-50', className)}
      data-admin-theme={theme}
    >
      {children}
    </div>
  )
}
