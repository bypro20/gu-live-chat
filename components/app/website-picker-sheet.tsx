'use client'

import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'

export type WebsitePickerItem = {
  websiteId: string
  name: string
  domain?: string | null
}

type WebsitePickerSheetProps = {
  open: boolean
  onClose: () => void
  websites: WebsitePickerItem[]
  activeWebsiteId?: string | null
  onSelect: (websiteId: string) => void
}

export function WebsitePickerSheet({
  open,
  onClose,
  websites,
  activeWebsiteId,
  onSelect,
}: WebsitePickerSheetProps) {
  const { shell } = useDashboardI18n()

  if (!open) return null

  return (
    <div className="native-sheet-backdrop" onClick={onClose}>
      <div className="native-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="native-sheet-handle" />
        <p className="text-base font-bold text-foreground px-4 pb-3">{shell.switchAccount}</p>
        <div className="max-h-72 overflow-y-auto px-2 pb-4">
          {websites.map((w) => (
            <button
              key={w.websiteId}
              type="button"
              onClick={() => {
                onSelect(w.websiteId)
                onClose()
              }}
              className={`native-hub-row w-full text-left ${w.websiteId === activeWebsiteId ? 'bg-primary/10' : ''}`}
            >
              <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold bg-primary/80 shrink-0">
                {w.name?.charAt(0)?.toUpperCase() || 'W'}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold truncate">{w.name}</span>
                <span className="block text-xs text-muted-foreground truncate">{w.domain || shell.noDomain}</span>
              </span>
              {w.websiteId === activeWebsiteId && (
                <svg className="w-5 h-5 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
