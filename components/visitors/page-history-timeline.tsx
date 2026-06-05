'use client'

import type { VisitorActivity } from '@/lib/stores/live-visitors-store'
import { extractPageHistory, getFaviconUrl, formatTimeAgo, type VisitorTheme } from '@/lib/visitors-utils'

interface PageHistoryTimelineProps {
  activities: VisitorActivity[]
  theme?: VisitorTheme
}

export function PageHistoryTimeline({ activities, theme = 'dashboard' }: PageHistoryTimelineProps) {
  const pages = extractPageHistory(activities).reverse() // newest last in timeline (top = most recent)

  if (pages.length === 0) return null

  // Show newest first (reverse the chronological order)
  const displayPages = [...pages].reverse().slice(0, 8)

  return (
    <div className="rounded-xl bg-white dark:bg-[#1a1d2e] border border-gray-100 dark:border-white/5 overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">Sayfa Geçmişi</p>
        <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded-full font-medium">
          {pages.length}
        </span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {displayPages.map((page, idx) => {
          const isCurrent = idx === 0 // first item is most recent
          const faviconUrl = getFaviconUrl(page.url)

          return (
            <div
              key={`${page.url}-${idx}`}
              className="relative flex items-start gap-2.5 px-3.5 py-2 border-b border-gray-50 dark:border-white/[0.03] last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              {/* Timeline dot */}
              <div className="shrink-0 mt-1 relative z-10">
                {isCurrent ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20">
                    <div className="w-full h-full bg-emerald-500 rounded-full animate-ping opacity-75" />
                  </div>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 mt-[1.5px] ml-[1px]" />
                )}
              </div>

              {/* Page info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {faviconUrl ? (
                    <img
                      src={faviconUrl}
                      alt=""
                      className="w-3.5 h-3.5 rounded shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  )}
                  <p className={`text-xs font-medium truncate ${isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                    {page.title}
                  </p>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5 ml-5">
                  {page.url.length > 50 ? page.url.substring(0, 50) + '…' : page.url}
                </p>
              </div>

              {/* Time */}
              <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
                {formatTimeAgo(page.timestamp)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}