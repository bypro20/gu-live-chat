'use client'

import type { VisitorActivity } from '@/lib/stores/live-visitors-store'
import { formatTimeAgo, type VisitorTheme } from '@/lib/visitors-utils'

interface ActivityFeedProps {
  activities: VisitorActivity[]
  theme?: VisitorTheme
}

function ActivityIcon({ eventType }: { eventType: string }) {
  switch (eventType) {
    case 'pageview':
      return (
        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
      )
    case 'click':
      return (
        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
          </svg>
        </div>
      )
    case 'typing':
    case 'input':
      return (
        <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </div>
      )
    case 'focus':
      return (
        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166v3.577m-11.668 0V4.166M18 6.166l-2.5 2.5M6.666 6.166l2.5 2.5m9.168 9.168l-2.5-2.5m-9.168 0l2.5 2.5M2.25 12h3.75m8.25 0h3.75M2.25 18h3.75m8.25 0h3.75" />
          </svg>
        </div>
      )
    case 'scroll':
      return (
        <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-500/10 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </div>
      )
    case 'online':
      return (
        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
      )
    case 'offline':
      return (
        <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-500/10 flex items-center justify-center shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-500" />
        </div>
      )
    default:
      return (
        <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-500/10 flex items-center justify-center shrink-0">
          <span className="text-xs">•</span>
        </div>
      )
  }
}

function ActivityLabel({ activity }: { activity: VisitorActivity }) {
  switch (activity.eventType) {
    case 'pageview':
      return (
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Sayfa görüntülendi</p>
          <p className="text-[11px] text-blue-500 dark:text-blue-400 truncate mt-0.5">{activity.title || activity.url}</p>
        </div>
      )
    case 'typing':
    case 'input':
      return (
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Yazıyor</p>
          {activity.text && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 italic truncate mt-0.5">
              &ldquo;{activity.text}&rdquo;
            </p>
          )}
        </div>
      )
    case 'click':
      return (
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Tıkladı</p>
          {activity.text && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{activity.text}</p>
          )}
        </div>
      )
    case 'focus':
      return (
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Form alanına odaklandı</p>
          {activity.fieldName && (
            <p className="text-[11px] text-indigo-500 dark:text-indigo-400 truncate mt-0.5">{activity.fieldName}</p>
          )}
        </div>
      )
    case 'scroll':
      return (
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">Kaydırdı</p>
          {activity.scrollPercentage !== undefined && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                  style={{ width: `${activity.scrollPercentage}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 font-medium">%{activity.scrollPercentage}</span>
            </div>
          )}
        </div>
      )
    case 'online':
      return (
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Siteye girdi</p>
        </div>
      )
    case 'offline':
      return (
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Siteden çıktı</p>
        </div>
      )
    default:
      return (
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500">{activity.eventType}</p>
        </div>
      )
  }
}

export function ActivityFeed({ activities, theme = 'dashboard' }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <span className="text-2xl mb-2">📡</span>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ziyaretçinin aktiviteleri burada görünecek</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Sayfa geçişleri, tıklamalar ve yazılar gerçek zamanlı aktarılır
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold mb-2">Canlı Aktivite</p>
      {activities.slice(0, 30).map((activity, idx) => (
        <div
          key={`${activity.timestamp}-${idx}`}
          className="flex items-start gap-2.5 p-2 rounded-lg bg-white dark:bg-[#1a1d2e]/50 border border-gray-100 dark:border-white/[0.03]"
        >
          <ActivityIcon eventType={activity.eventType} />
          <ActivityLabel activity={activity} />
          <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0 mt-0.5">
            {formatTimeAgo(activity.timestamp)}
          </span>
        </div>
      ))}
    </div>
  )
}