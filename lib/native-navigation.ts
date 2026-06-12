/** Native müşteri uygulaması — alt sekme kök rotaları */
export const NATIVE_ROOT_TABS = ['/inbox', '/dashboard', '/contacts', '/settings'] as const

export function isNativeRootTab(pathname: string | null): boolean {
  if (!pathname) return false
  return (NATIVE_ROOT_TABS as readonly string[]).includes(pathname)
}

export function nativeBackHref(pathname: string | null): string {
  if (!pathname) return '/inbox'
  if (pathname.startsWith('/settings/')) return '/settings'
  if (pathname.startsWith('/contacts/')) return '/contacts'
  return '/inbox'
}
