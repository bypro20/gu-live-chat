'use client'

import { useEffect, useState } from 'react'

/** Tailwind lg — inbox master/detail mobil/tablet (<1024px) */
export const INBOX_NARROW_MQ = '(max-width: 1023px)'

export function isInboxNarrowLayout() {
  return typeof window !== 'undefined' && window.matchMedia(INBOX_NARROW_MQ).matches
}

/** lg altı ekran — liste/sohbet geçişi için reaktif */
export function useInboxNarrowLayout() {
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(INBOX_NARROW_MQ).matches
  )

  useEffect(() => {
    const mq = window.matchMedia(INBOX_NARROW_MQ)
    const sync = () => setIsNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return isNarrow
}

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
  'fixed inset-0 z-[60] flex w-full h-[100dvh] max-h-[100dvh] lg:static lg:inset-auto lg:z-auto lg:w-auto lg:h-auto lg:max-h-none'

/** Admin master-detail: mobilde tam ekran, md+ yan yana */
export const ADMIN_SPLIT_DETAIL =
  'fixed inset-0 z-[60] flex w-full h-[100dvh] max-h-[100dvh] md:static md:inset-auto md:z-auto md:flex-1 md:min-h-0 md:max-h-none'

/** Admin master-detail: mobil/tablet tam ekran, xl+ yan yana (ziyaretçi izleme) */
export const ADMIN_VISITOR_DETAIL =
  'fixed inset-0 z-[60] flex w-full h-[100dvh] max-h-[100dvh] xl:static xl:inset-auto xl:z-auto xl:flex-1 xl:min-h-0 xl:max-h-none'

/** Sadece dar ekranda üst barı gizle */
export function useAdminMobileDetail(active: boolean, mq = '(max-width: 767px)') {
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia(mq)
    const sync = () => {
      if (active && media.matches) {
        root.setAttribute('data-admin-mobile-detail', '1')
      } else {
        root.removeAttribute('data-admin-mobile-detail')
      }
    }
    sync()
    media.addEventListener('change', sync)
    return () => {
      media.removeEventListener('change', sync)
      root.removeAttribute('data-admin-mobile-detail')
    }
  }, [active, mq])
}
