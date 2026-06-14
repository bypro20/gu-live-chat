'use client'

import { useEffect } from 'react'

/** Mobilde aktif sohbet açıkken shell üst barını gizlemek için html işaretler. */
export function useInboxMobileChat(active: boolean) {
  useEffect(() => {
    const root = document.documentElement
    if (active) {
      root.setAttribute('data-inbox-mobile-chat', '1')
    } else {
      root.removeAttribute('data-inbox-mobile-chat')
    }
    return () => root.removeAttribute('data-inbox-mobile-chat')
  }, [active])
}

export const INBOX_CHAT_PANEL_MOBILE =
  'fixed inset-0 z-[60] flex w-full h-[100dvh] max-h-[100dvh] md:static md:inset-auto md:z-auto md:w-auto md:h-auto md:max-h-none'

/** Admin master-detail: mobilde tam ekran, md+ yan yana */
export const ADMIN_SPLIT_DETAIL =
  'fixed inset-0 z-[60] flex w-full h-[100dvh] max-h-[100dvh] md:static md:inset-auto md:z-auto md:flex-1 md:min-h-0 md:max-h-none'

/** Sadece dar ekranda (< md) üst barı gizle */
export function useAdminMobileDetail(active: boolean) {
  useEffect(() => {
    const root = document.documentElement
    const sync = () => {
      const narrow = window.matchMedia('(max-width: 767px)').matches
      if (active && narrow) {
        root.setAttribute('data-admin-mobile-detail', '1')
      } else {
        root.removeAttribute('data-admin-mobile-detail')
      }
    }
    sync()
    window.addEventListener('resize', sync)
    return () => {
      window.removeEventListener('resize', sync)
      root.removeAttribute('data-admin-mobile-detail')
    }
  }, [active])
}
