'use client'

import type { LiveVisitor } from '@/lib/stores/live-visitors-store'
import { getFaviconUrl, parsePageUrl, getAccent, type VisitorTheme } from '@/lib/visitors-utils'

interface CurrentPageCardProps {
  visitor: LiveVisitor
  theme?: VisitorTheme
}

export function CurrentPageCard({ visitor, theme = 'dashboard' }: CurrentPageCardProps) {
  const accent = getAccent(theme)
  const pageUrl = visitor.currentPage
  const pageTitle = visitor.currentTitle || visitor.currentPage
  const parsed = parsePageUrl(pageUrl)
  const faviconUrl = getFaviconUrl(pageUrl)

  if (!pageUrl) return null

  return (
    <div className={`p-3.5 rounded-xl border-l-[3px] ${accent.border} ${accent.gradient} ${accent.borderFull}`}>
      <div className="flex items-start gap-2.5">
        {/* Favicon */}
        <div className="shrink-0 mt-0.5">
          {faviconUrl ? (
            <img
              src={faviconUrl}
              alt=""
              className="w-5 h-5 rounded"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Şu an bu sayfada:</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mt-0.5">
            {pageTitle}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {parsed.domain && (
              <>
                <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className={`text-xs ${accent.text} truncate`}>
                  {parsed.domain}
                </span>
              </>
            )}
            {parsed.path && parsed.path !== '/' && (
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                {parsed.path}
              </span>
            )}
          </div>
        </div>

        {visitor.isLive && (
          <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            CANLI
          </span>
        )}
      </div>
    </div>
  )
}