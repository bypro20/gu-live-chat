'use client'

import type { LiveVisitor } from '@/lib/stores/live-visitors-store'
import { formatDuration, getBrowserEmoji, getDeviceEmoji, getAccent, type VisitorTheme } from '@/lib/visitors-utils'

interface VisitorStatusHeaderProps {
  visitor: LiveVisitor
  theme?: VisitorTheme
}

export function VisitorStatusHeader({ visitor, theme = 'dashboard' }: VisitorStatusHeaderProps) {
  const accent = getAccent(theme)

  return (
    <div className="flex items-start gap-4">
      <div className="relative shrink-0">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accent.avatar} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
          {(visitor.name || 'A')[0].toUpperCase()}
        </div>
        {visitor.isLive && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-3 border-white dark:border-[#12121f] rounded-full">
            <div className="w-full h-full bg-emerald-500 rounded-full animate-ping opacity-75" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {visitor.name || 'Anonim Ziyaretçi'}
          </h3>
          {visitor.isLive && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              ÇEVRİMİÇİ
            </span>
          )}
        </div>

        {visitor.email && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{visitor.email}</p>
        )}

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {visitor.browser && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getBrowserEmoji(visitor.browser)} {visitor.browser}
            </span>
          )}
          {visitor.os && (
            <span className="text-xs text-gray-500 dark:text-gray-400">· {visitor.os}</span>
          )}
          {visitor.device && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              · {getDeviceEmoji(visitor.device)} {visitor.device}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1.5">
          {visitor.startedAt && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              ⏱ {formatDuration(visitor.startedAt)}
            </span>
          )}
          {visitor.country && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              📍 {visitor.country}{visitor.city ? `, ${visitor.city}` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}