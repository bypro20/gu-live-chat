'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  getNativeAppPlatform,
  markNativeApp,
  nativeAppHomePath,
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

/** Capacitor / APK modunu başlatır; marketing sayfalarından uygulama kabuğuna yönlendirir */
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
    if (!getNativeAppPlatform()) return
    if (!pathname || !MARKETING_PATHS.has(pathname)) return

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

  return null
}
