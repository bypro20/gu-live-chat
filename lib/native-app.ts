/** Gu Chat native (Capacitor) uygulama algılama */

export const NATIVE_APP_STORAGE_KEY = 'gu-native-app'

export type NativeAppPlatform = 'android' | 'ios'

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean
    getPlatform?: () => string
  }
}

export function parseNativeAppFromSearch(search: string): NativeAppPlatform | null {
  const app = new URLSearchParams(search).get('app')
  if (app === 'android' || app === 'ios') return app
  return null
}

export function markNativeApp(platform: NativeAppPlatform) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(NATIVE_APP_STORAGE_KEY, platform)
  } catch {
    // private mode
  }
  document.documentElement.classList.add('native-app', `native-app-${platform}`)
}

export function getNativeAppPlatform(): NativeAppPlatform | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(NATIVE_APP_STORAGE_KEY)
    if (stored === 'android' || stored === 'ios') return stored
  } catch {
    // ignore
  }

  const cap = (window as CapacitorWindow).Capacitor
  if (cap?.isNativePlatform?.()) {
    const p = cap.getPlatform?.()
    if (p === 'android' || p === 'ios') return p
    return 'android'
  }

  if (/GuChatApp/i.test(navigator.userAgent)) return 'android'
  return null
}

export function isNativeApp(): boolean {
  return getNativeAppPlatform() !== null
}

/** Native uygulamada varsayılan giriş sonrası rota */
export function nativeAppHomePath(): string {
  return '/inbox'
}
