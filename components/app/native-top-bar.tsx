'use client'

import { useRouter } from 'next/navigation'
import NotificationBell from '@/components/dashboard/notification-bell'
import { AppLogo } from '@/components/brand/app-logo'
import { isNativeRootTab, nativeBackHref } from '@/lib/native-navigation'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'

interface NativeTopBarProps {
  pathname: string | null
  pageTitle: string | null
  websiteName?: string | null
  onOpenWebsitePicker?: () => void
}

export function NativeTopBar({
  pathname,
  pageTitle,
  websiteName,
  onOpenWebsitePicker,
}: NativeTopBarProps) {
  const router = useRouter()
  const { shell } = useDashboardI18n()
  const showBack = !isNativeRootTab(pathname)

  return (
    <header className="native-app-topbar shrink-0 flex items-center gap-2 px-3 sm:px-4 sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xl">
      {showBack ? (
        <button
          type="button"
          onClick={() => router.push(nativeBackHref(pathname))}
          className="native-touch-target shrink-0 -ml-1 flex items-center justify-center rounded-xl text-foreground active:bg-accent transition-colors"
          aria-label={shell.back}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      ) : (
        <div className="shrink-0 w-8" aria-hidden />
      )}

      <div className="flex-1 min-w-0">
        {pageTitle ? (
          <p className="text-base font-bold text-foreground truncate leading-tight">{pageTitle}</p>
        ) : (
          <AppLogo variant="light" size="sm" showTagline={false} className="max-w-full" />
        )}
        {websiteName && isNativeRootTab(pathname) && (
          <button
            type="button"
            onClick={onOpenWebsitePicker}
            className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-primary truncate max-w-full active:opacity-80"
            aria-label={shell.switchAccount}
          >
            <span className="truncate">{websiteName}</span>
            <span className="shrink-0 opacity-80">· {shell.switchAccount}</span>
            <svg className="w-3 h-3 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      <div className="shrink-0">
        <NotificationBell variant="toolbar" />
      </div>
    </header>
  )
}
