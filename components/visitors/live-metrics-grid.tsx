'use client'

import type { LiveVisitor } from '@/lib/stores/live-visitors-store'
import { getScrollPercent, getDeviceEmoji, type VisitorTheme } from '@/lib/visitors-utils'

interface LiveMetricsGridProps {
  visitor: LiveVisitor
  recentClicks: Array<{ x: number; y: number; timestamp: string }>
  theme?: VisitorTheme
}

export function LiveMetricsGrid({ visitor, recentClicks, theme = 'dashboard' }: LiveMetricsGridProps) {
  const hasCursor = visitor.cursorX !== undefined && visitor.cursorX > 0
  const scrollPercent = getScrollPercent(visitor)
  const clickCount = recentClicks.filter(
    (c) => Date.now() - new Date(c.timestamp).getTime() < 10000
  ).length

  const cardClass = 'p-3 rounded-xl bg-white dark:bg-[#1a1d2e] border border-gray-100 dark:border-white/5'

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Cursor */}
      <div className={cardClass}>
        <div className="flex items-center gap-1.5 mb-1">
          <svg className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
          </svg>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Cursor</p>
        </div>
        <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">
          {hasCursor ? `${Math.round(visitor.cursorX || 0)}, ${Math.round(visitor.cursorY || 0)}` : '—'}
        </p>
        {hasCursor && (
          <div className="mt-1.5 relative w-full h-1 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, ((visitor.cursorX || 0) / (visitor.viewportW || 1440)) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Viewport */}
      <div className={cardClass}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm">{getDeviceEmoji(visitor.device)}</span>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Ekran</p>
        </div>
        <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">
          {visitor.viewportW ? `${visitor.viewportW}×${visitor.viewportH}` : '—'}
        </p>
        {visitor.viewportW && (
          <div className="mt-1.5 flex justify-center">
            <div
              className="border-2 border-purple-300 dark:border-purple-500/40 rounded-sm"
              style={{
                width: `${Math.min(48, (visitor.viewportW / 1920) * 48)}px`,
                height: `${Math.min(28, ((visitor.viewportH || 900) / 1080) * 28)}px`,
              }}
            />
          </div>
        )}
      </div>

      {/* Scroll */}
      <div className={cardClass}>
        <div className="flex items-center gap-1.5 mb-1">
          <svg className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Scroll</p>
        </div>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {scrollPercent !== null ? `%${scrollPercent}` : '—'}
        </p>
        {scrollPercent !== null && (
          <div className="mt-1.5 w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, scrollPercent)}%` }}
            />
          </div>
        )}
      </div>

      {/* Clicks */}
      <div className={cardClass}>
        <div className="flex items-center gap-1.5 mb-1">
          <svg className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.117 7.25l-2.897.777M5.117 7.25l2.897-.777M7.188 2.239l-.777 2.897" />
          </svg>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Tıklama</p>
        </div>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {clickCount > 0 ? clickCount : '—'}
        </p>
        {clickCount > 0 && (
          <div className="flex gap-0.5 mt-1.5">
            {Array.from({ length: Math.min(clickCount, 5) }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-emerald-500" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}