'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  getNativeAppPlatform,
  isNativeAdminUserAgent,
  isNativeBlockedPath,
  isNativeCustomerUserAgent,
  markNativeApp,
  nativeAppHomePath,
  nativeAppRedirectForBlocked,
  nativeAdminHomePath,
  parseNativeAppFromSearch,
} from '@/lib/native-app'

const MARKETING_PATHS = new Set([
  '/',
  '/pricing',
  '/features',
  '/ai',
  '/blog',
  '/contact',
  '/mobil-indir',
  '/canli-destek',
  '/chatbot',
  '/whatsapp-destek',
  '/integrations',
])

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean
    getPlatform?: () => string
    Plugins?: Record<
      string,
      {
        getInfo?: () => Promise<{ id?: string }>
        setStyle?: (opts: object) => void
        setBackgroundColor?: (opts: object) => void
        setOverlaysWebView?: (opts: { overlay: boolean }) => void
        hide?: () => void
      }
    >
  }
}

async function detectNativePlatformFromShell(): Promise<'admin' | 'android' | 'ios' | null> {
  const cap = (window as CapacitorWindow).Capacitor
  if (!cap?.isNativePlatform?.()) return null

  try {
    const info = await cap.Plugins?.App?.getInfo?.()
    if (info?.id === 'org.guchat.admin') return 'admin'
    if (info?.id === 'org.guchat.app') return 'android'
  } catch {
    // ignore
  }

  if (isNativeAdminUserAgent(navigator.userAgent)) return 'admin'
  if (isNativeCustomerUserAgent(navigator.userAgent)) return 'android'

  const platform = cap.getPlatform?.()
  if (platform === 'ios') return 'ios'
  if (platform === 'android') return 'android'
  return null
}

/** Capacitor modunu başlatır; müşteri ve yönetici uygulaması rotalarını ayırır */
export function NativeAppBootstrap() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      const fromUrl = parseNativeAppFromSearch(window.location.search)
      if (fromUrl) {
        markNativeApp(fromUrl)
        const url = new URL(window.location.href)
        url.searchParams.delete('app')
        const clean = url.pathname + url.search + url.hash
        window.history.replaceState({}, '', clean)
      } else {
        const shellPlatform = await detectNativePlatformFromShell()
        if (shellPlatform) {
          markNativeApp(shellPlatform)
        } else {
          const platform = getNativeAppPlatform()
          if (platform) markNativeApp(platform)
        }
      }

      if (cancelled) return

      try {
        const cap = (window as CapacitorWindow).Capacitor
        const platform = getNativeAppPlatform()
        cap?.Plugins?.StatusBar?.setStyle?.({ style: 'DARK' })
        if (platform === 'admin') {
          cap?.Plugins?.StatusBar?.setBackgroundColor?.({ color: '#080C14' })
        } else {
          cap?.Plugins?.StatusBar?.setBackgroundColor?.({ color: '#00000000' })
          cap?.Plugins?.StatusBar?.setOverlaysWebView?.({ overlay: true })
        }
        cap?.Plugins?.SplashScreen?.hide?.()
      } catch {
        // native plugin hataları uygulamayı kapatmasın
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const platform = getNativeAppPlatform()
    if (!platform || !pathname) return

    if (isNativeBlockedPath(pathname, platform)) {
      router.replace(nativeAppRedirectForBlocked(pathname, platform))
      return
    }

    if (platform === 'admin') return

    if (!MARKETING_PATHS.has(pathname)) return

    fetch('/api/auth/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((session) => {
        if (session?.user) {
          router.replace(nativeAppHomePath())
        } else {
          router.replace('/login')
        }
      })
      .catch(() => router.replace('/login'))
  }, [pathname, router])

  useEffect(() => {
    const platform = getNativeAppPlatform()
    if (platform !== 'admin' || !pathname) return
    if (pathname !== '/admin-login' && pathname !== '/panel-giris') return

    fetch('/api/auth/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((session) => {
        if (session?.user?.role === 'ADMIN') {
          router.replace(nativeAdminHomePath())
        }
      })
      .catch(() => {})
  }, [pathname, router])

  return null
}
