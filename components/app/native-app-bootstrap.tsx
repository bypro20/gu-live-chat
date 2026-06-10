'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  getNativeAppPlatform,
  isNativeBlockedPath,
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

/** Capacitor modunu başlatır; müşteri ve yönetici uygulaması rotalarını ayırır */
export function NativeAppBootstrap() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const fromUrl = parseNativeAppFromSearch(window.location.search)
    if (fromUrl) {
      markNativeApp(fromUrl)
      const url = new URL(window.location.href)
      url.searchParams.delete('app')
      const clean = url.pathname + url.search + url.hash
      window.history.replaceState({}, '', clean)
    } else {
      const platform = getNativeAppPlatform()
      if (platform) markNativeApp(platform)
    }

    const cap = (window as Window & { Capacitor?: { Plugins?: Record<string, { setStyle?: (o: object) => void; setBackgroundColor?: (o: object) => void; hide?: () => void }> } }).Capacitor
    cap?.Plugins?.StatusBar?.setStyle?.({ style: 'DARK' })
    cap?.Plugins?.StatusBar?.setBackgroundColor?.({ color: '#0B1220' })
    cap?.Plugins?.SplashScreen?.hide?.()
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
