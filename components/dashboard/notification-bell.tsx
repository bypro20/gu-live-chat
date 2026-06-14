'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/lib/hooks/use-notifications'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'
import { formatNotificationTimeAgo } from '@/lib/dashboard-i18n'
import { AdminOverlayHost } from '@/components/admin/admin-overlay-host'

function getNotificationIcon(type: string) {
  switch (type) {
    case 'NEW_CONVERSATION':
      return (
        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    case 'NEW_MESSAGE':
      return (
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    default:
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
  }
}

type NotificationBellProps = {
  /** Gelen kutusu yolu — müşteri: /inbox, admin: /admin/inbox */
  inboxBasePath?: string
  /** sidebar = koyu kenar çubuğu, toolbar = açık üst bar */
  variant?: 'sidebar' | 'toolbar'
  /** Admin panelinde portal teması (body'ye taşınan dropdown) */
  adminThemed?: boolean
}

function useIsMobilePanel() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isMobile
}

export default function NotificationBell({
  inboxBasePath = '/inbox',
  variant = 'sidebar',
  adminThemed = false,
}: NotificationBellProps) {
  const router = useRouter()
  const d = useDashboardI18n()
  const n = d.notifications
  const c = d.common
  const isMobilePanel = useIsMobilePanel()
  const useSheet = variant === 'toolbar' && isMobilePanel
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    markingAsRead,
  } = useNotifications()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open || useSheet) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, useSheet])

  const updateMenuPosition = useCallback(() => {
    const btn = buttonRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const panelW = 320
    const gap = 8
    let left = rect.right - panelW
    left = Math.max(8, Math.min(left, window.innerWidth - panelW - 8))
    const top = rect.bottom + gap
    setMenuPos({ top, left })
  }, [])

  useEffect(() => {
    if (!open || useSheet) return
    updateMenuPosition()
    const onScrollOrResize = () => updateMenuPosition()
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [open, updateMenuPosition, useSheet])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        buttonRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleOpen = () => {
    if (!open && !useSheet) updateMenuPosition()
    setOpen((v) => !v)
  }

  const handleNotificationClick = async (notification: {
    id: string
    readAt: string | null
    type: string
    data: string | null
  }) => {
    if (!notification.readAt) {
      await markAsRead([notification.id])
    }
    setOpen(false)

    if (notification.type === 'NEW_MESSAGE' || notification.type === 'NEW_CONVERSATION') {
      try {
        const data = notification.data ? JSON.parse(notification.data) : {}
        if (data.conversationId) {
          router.push(`${inboxBasePath}?conversation=${data.conversationId}`)
        }
      } catch {
        /* ignore */
      }
    }
  }

  const panelSurfaceClass = adminThemed
    ? 'admin-notification-panel border shadow-2xl shadow-black/50 overflow-hidden flex flex-col'
    : 'bg-[#1E1B2E] border border-white/[0.08] shadow-2xl shadow-black/50 overflow-hidden flex flex-col'

  const dropdownPanelClass = adminThemed
    ? 'fixed w-80 admin-notification-panel border rounded-xl shadow-2xl shadow-black/50 z-[200] overflow-hidden'
    : 'fixed w-80 bg-[#1E1B2E] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 z-[200] overflow-hidden'

  const notificationList = (
    <div className="max-h-[min(24rem,calc(100vh-6rem))] overflow-y-auto overscroll-contain">
      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center admin-notification-empty">
          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-xs">{n.empty}</p>
        </div>
      ) : (
        notifications.slice(0, 30).map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => handleNotificationClick(notification)}
            className={`admin-notification-item w-full flex items-start gap-3 px-4 py-3.5 transition text-left group cursor-pointer touch-manipulation min-h-[52px] ${
              adminThemed ? 'hover:bg-[var(--admin-bg-hover)]' : 'hover:bg-white/[0.06]'
            } ${!notification.readAt ? (adminThemed ? 'bg-[var(--admin-accent-soft)]' : 'bg-[#1972F5]/8') : ''}`}
          >
            <div className="mt-0.5 shrink-0">{getNotificationIcon(notification.type)}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${!notification.readAt ? (adminThemed ? 'admin-text' : 'text-white') : (adminThemed ? 'admin-text-secondary' : 'text-gray-300')}`}>
                {notification.title}
                {!notification.readAt && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-primary align-middle" />
                )}
              </p>
              <p className={`text-[11px] mt-0.5 line-clamp-2 ${adminThemed ? 'admin-text-muted' : 'text-gray-400'}`}>{notification.message}</p>
              <p className={`text-[10px] mt-1 ${adminThemed ? 'admin-text-faint' : 'text-gray-500'}`}>{formatNotificationTimeAgo(notification.createdAt, d)}</p>
            </div>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                deleteNotification(notification.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation()
                  deleteNotification(notification.id)
                }
              }}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 -mr-1 text-gray-500 hover:text-rose-400 transition cursor-pointer touch-manipulation"
              title={c.delete}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </button>
        ))
      )}
    </div>
  )

  const panelHeader = (
    <div
      className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${adminThemed ? '' : 'border-white/[0.06]'}`}
      style={adminThemed ? { borderColor: 'var(--admin-border)' } : undefined}
    >
      <h3 className={`text-sm font-semibold ${adminThemed ? 'admin-text' : 'text-white'}`}>{n.title}</h3>
      {unreadCount > 0 && (
        <button
          type="button"
          onClick={() => markAllAsRead()}
          disabled={markingAsRead}
          className="text-[11px] text-[#60A5FA] hover:text-[#93C5FD] transition disabled:opacity-50 cursor-pointer touch-manipulation py-2 px-1"
        >
          {n.markAllRead}
        </button>
      )}
    </div>
  )

  const panel = open && mounted ? (
    useSheet ? (
      <>
        <button
          type="button"
          className="notification-sheet-backdrop lg:hidden"
          aria-label={c.cancel}
          onClick={() => setOpen(false)}
        />
        <div
          ref={panelRef}
          className={`notification-sheet-panel lg:hidden ${panelSurfaceClass}`}
        >
          {panelHeader}
          {notificationList}
        </div>
      </>
    ) : (
      <div
        ref={panelRef}
        className={dropdownPanelClass}
        style={{ top: menuPos.top, left: menuPos.left }}
      >
        {panelHeader}
        {notificationList}
      </div>
    )
  ) : null

  const buttonClass =
    variant === 'toolbar'
      ? 'relative p-2 min-w-[44px] min-h-[44px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition cursor-pointer touch-manipulation flex items-center justify-center'
      : 'relative p-2 min-w-[44px] min-h-[44px] rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition cursor-pointer touch-manipulation flex items-center justify-center'

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className={buttonClass}
        title={n.title}
        aria-label={n.title}
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[1rem] h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {mounted && panel
        ? createPortal(adminThemed ? <AdminOverlayHost>{panel}</AdminOverlayHost> : panel, document.body)
        : null}
    </>
  )
}
