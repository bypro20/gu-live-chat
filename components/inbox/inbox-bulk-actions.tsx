'use client'

import { Trash2, X, CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'

type InboxBulkActionsBarProps = {
  selectionMode: boolean
  selectedCount: number
  totalVisible: number
  deleting?: boolean
  onToggleSelectionMode: () => void
  onSelectAll: () => void
  onClearSelection: () => void
  onBulkDelete: () => void
}

export function InboxBulkActionsBar({
  selectionMode,
  selectedCount,
  totalVisible,
  deleting,
  onToggleSelectionMode,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
}: InboxBulkActionsBarProps) {
  const i = useDashboardI18n().inbox

  if (!selectionMode) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 text-xs shrink-0"
        onClick={onToggleSelectionMode}
      >
        <CheckSquare className="w-3.5 h-3.5 mr-1" />
        {i.selectMode}
      </Button>
    )
  }

  const allSelected = totalVisible > 0 && selectedCount === totalVisible

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 text-xs"
        onClick={onToggleSelectionMode}
      >
        <X className="w-3.5 h-3.5 mr-1" />
        {i.cancelSelect}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 text-xs"
        onClick={allSelected ? onClearSelection : onSelectAll}
      >
        {allSelected ? (
          <>
            <Square className="w-3.5 h-3.5 mr-1" />
            {i.clearSelection}
          </>
        ) : (
          <>
            <CheckSquare className="w-3.5 h-3.5 mr-1" />
            {i.selectAll}
          </>
        )}
      </Button>
      {selectedCount > 0 && (
        <>
          <span className="text-[11px] text-muted-foreground tabular-nums px-1">
            {i.selectedCount(selectedCount)}
          </span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-8 text-xs"
            disabled={deleting}
            onClick={onBulkDelete}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            {i.bulkDelete(selectedCount)}
          </Button>
        </>
      )}
    </div>
  )
}
