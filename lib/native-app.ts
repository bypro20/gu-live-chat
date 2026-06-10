/** Gu Chat native (Capacitor) uygulama algılama */

export const NATIVE_APP_STORAGE_KEY = 'gu-native-app'

/** Müşteri APK */
export const NATIVE_CUSTOMER_UA = 'GuChatApp'
/** Yönetici APK — ayrı uygulama */
export const NATIVE_ADMIN_UA = 'GuChatAdminApp'

export type NativeAppPlatform = 'android' | 'ios' | 'admin'

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean
    getPlatform?: () => string
  }
}

const CUSTOMER_MARKETING_PATHS = new Set([
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

const ADMIN_ONLY_PREFIXES = ['/admin']
const ADMIN_LOGIN_PATH = '/admin-login'

export function parseNativeAppFromSearch(search: string): NativeAppPlatform | null {
  const app = new URLSearchParams(search).get('app')
  if (app === 'admin') return 'admin'
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

export function clearNativeAppMark() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(NATIVE_APP_STORAGE_KEY)
  } catch {
    // ignore
  }
  document.documentElement.classList.remove(
    'native-app',
    'native-app-android',
    'native-app-ios',
    'native-app-admin'
  )
}

export function getNativeAppPlatform(): NativeAppPlatform | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(NATIVE_APP_STORAGE_KEY)
    if (stored === 'android' || stored === 'ios' || stored === 'admin') return stored
  } catch {
    // ignore
  }

  if (/GuChatAdminApp/i.test(navigator.userAgent)) return 'admin'
  if (/GuChatApp/i.test(navigator.userAgent)) return 'android'

  const cap = (window as CapacitorWindow).Capacitor
  if (cap?.isNativePlatform?.()) {
    const p = cap.getPlatform?.()
    if (p === 'android' || p === 'ios') return p
    return 'android'
  }

  return null
}

export function isNativeApp(): boolean {
  return getNativeAppPlatform() !== null
}

export function isNativeAdminApp(): boolean {
  return getNativeAppPlatform() === 'admin'
}

export function isNativeCustomerApp(): boolean {
  const p = getNativeAppPlatform()
  return p === 'android' || p === 'ios'
}

/** Native müşteri uygulamasında varsayılan rota */
export function nativeAppHomePath(): string {
  return '/inbox'
}

/** Native yönetici uygulamasında varsayılan rota */
export function nativeAdminHomePath(): string {
  return '/admin'
}

export function isNativeBlockedPath(pathname: string, platform: NativeAppPlatform): boolean {
  if (platform === 'admin') {
    if (CUSTOMER_MARKETING_PATHS.has(pathname)) return true
    if (pathname === '/login' || pathname === '/register') return true
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/inbox') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/contacts') ||
      pathname.startsWith('/visitors') ||
      pathname.startsWith('/analytics')
    ) {
      return true
    }
    return false
  }

  // Müşteri uygulaması — admin erişimi yok
  if (pathname === ADMIN_LOGIN_PATH || pathname === '/panel-giris') return true
  if (ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true
  }
  return false
}

export function nativeAppRedirectForBlocked(pathname: string, platform: NativeAppPlatform): string {
  if (platform === 'admin') {
    return pathname === ADMIN_LOGIN_PATH ? ADMIN_LOGIN_PATH : nativeAdminHomePath()
  }
  return nativeAppHomePath()
}
