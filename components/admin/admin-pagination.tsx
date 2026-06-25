'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type AdminPaginationProps = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  className?: string
}

export function AdminPagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  className,
}: AdminPaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t',
        className,
      )}
      style={{ borderColor: 'var(--admin-border)' }}
    >
      <p className="text-xs admin-text-muted tabular-nums">
        {total === 0 ? 'Kayıt yok' : `${start}–${end} / ${total.toLocaleString('tr-TR')}`}
      </p>

      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 rounded-lg border px-2 text-xs admin-input"
            aria-label="Sayfa boyutu"
          >
            {[25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} / sayfa
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="admin-btn-ghost h-9 px-3 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs admin-text-secondary tabular-nums min-w-[4.5rem] text-center">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="admin-btn-ghost h-9 px-3 disabled:opacity-40"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
