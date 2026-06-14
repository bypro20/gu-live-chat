import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { detectLocaleContext, applyLocaleCookies } from '@/lib/locale-server'
import { isNativeCustomerUserAgent } from '@/lib/native-app'
import { applySecurityHeaders } from '@/lib/security-headers'
import { widgetApiCorsHeaders } from '@/lib/widget-api-cors'
import { auth } from '@/lib/auth'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

function isWidgetPublicApi(pathname: string) {
  return pathname.startsWith('/api/widget') || pathname.startsWith('/api/privacy/consent')
}

function withWidgetPublicApiHeaders(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get('origin')
  for (const [key, value] of Object.entries(widgetApiCorsHeaders(req))) {
    res.headers.set(key, value)
  }
  res.headers.set('X-Content-Type-Options', 'nosniff')
  if (IS_PRODUCTION) {
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
  return res
}

function withSecurityHeaders(res: NextResponse) {
  applySecurityHeaders(res, IS_PRODUCTION)
  return res
}

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim()
    if (ip) return ip
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return null
}

const IP_CHECK_PATHS = ['/register', '/api/register', '/api/widget', '/login', '/admin-login']

/** Dashboard / admin JSON API — oturum çerezi zorunlu (route içi yetki ayrı kontrol edilir). */
const PROTECTED_API_PREFIXES = [
  '/api/admin',
  '/api/socket',
  '/api/dashboard',
  '/api/analytics',
  '/api/websites',
  '/api/conversations',
  '/api/team',
  '/api/notifications',
  '/api/upload',
  '/api/ai/config',
  '/api/ai/suggest',
  '/api/ai/test',
  '/api/translate',
  '/api/contacts',
  '/api/visitors',
  '/api/inbox',
  '/api/tickets',
  '/api/workflows',
  '/api/webhooks',
  '/api/campaigns',
  '/api/proactive',
  '/api/chatbots',
  '/api/knowledge',
  '/api/addons',
  '/api/checkout',
  '/api/iyzico/checkout',
  '/api/iyzico/addon-checkout',
  '/api/iyzico/subscription',
  '/api/trial',
  '/api/user',
  '/api/invoices',
  '/api/canned-responses',
  '/api/ratings',
  '/api/channels',
  '/api/privacy',
]

function requiresSessionForApi(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

async function checkIpBan(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl
  const shouldCheck = IP_CHECK_PATHS.some((p) => pathname.startsWith(p))
  if (!shouldCheck) return null

  const ip = getClientIp(req)
  if (!ip) return null

  try {
    const { isIpBanned } = await import('@/lib/ip-ban')
    if (await isIpBanned(ip)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Erişim engellendi' }, { status: 403 })
      }
      return new NextResponse('Erişim engellendi', { status: 403 })
    }
  } catch {
    // Fail open if DB unavailable in edge context
  }

  return null
}

export async function proxy(req: NextRequest) {
  if (
    IS_PRODUCTION &&
    req.headers.get('x-forwarded-proto') === 'http' &&
    !req.nextUrl.hostname.includes('localhost')
  ) {
    const httpsUrl = req.nextUrl.clone()
    httpsUrl.protocol = 'https:'
    return withSecurityHeaders(NextResponse.redirect(httpsUrl, 308))
  }

  const ipBlock = await checkIpBan(req)
  if (ipBlock) return withSecurityHeaders(ipBlock)

  const { pathname } = req.nextUrl
  const ua = req.headers.get('user-agent') || ''
  const isCustomerApp = isNativeCustomerUserAgent(ua)

  // Legacy admin login URL alias
  if (pathname === '/panel-giris') {
    return withSecurityHeaders(NextResponse.redirect(new URL('/admin-login', req.url)))
  }

  // Müşteri APK — admin rotalarına erişim yok
  if (isCustomerApp) {
    if (pathname.startsWith('/admin') || pathname === '/admin-login' || pathname === '/panel-giris') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/inbox', req.url)))
    }
  }

  // Embed widget + public API — müşteri sitelerinden cross-origin erişim
  if (pathname.startsWith('/widget') || isWidgetPublicApi(pathname)) {
    if (req.method === 'OPTIONS' && isWidgetPublicApi(pathname)) {
      return withWidgetPublicApiHeaders(req, new NextResponse(null, { status: 204 }))
    }
    const res = NextResponse.next()
    if (isWidgetPublicApi(pathname)) {
      return withWidgetPublicApiHeaders(req, res)
    }
    res.headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
    res.headers.set('Content-Security-Policy', 'frame-ancestors *')
    return res
  }

  // Allow NextAuth routes — auth handles its own security
  if (pathname.startsWith('/api/auth')) {
    return withSecurityHeaders(NextResponse.next())
  }

  // Check for session cookie (NextAuth v5 uses authjs prefix)
  const sessionToken =
    req.cookies.get('authjs.session-token') ||
    req.cookies.get('__Secure-authjs.session-token') ||
    req.cookies.get('next-auth.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token')

  const isLoggedIn = !!sessionToken

  // Cron — route handler validates CRON_SECRET; block anonymous browser GET
  if (pathname.startsWith('/api/cron')) {
    const authHeader = req.headers.get('authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }
    return withSecurityHeaders(NextResponse.next())
  }

  // Protected JSON API — must have session cookie (role checks stay in route handlers)
  if (requiresSessionForApi(pathname) && !isLoggedIn) {
    return withSecurityHeaders(NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 }))
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|js|css|woff|woff2|ttf|apk)$/)
  ) {
    return withSecurityHeaders(NextResponse.next())
  }

  // Protected dashboard/app routes
  const protectedPaths = ['/dashboard', '/inbox', '/settings', '/contacts', '/visitors', '/analytics']
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return withSecurityHeaders(NextResponse.redirect(loginUrl))
    }
  }

  // Admin routes — oturum + ADMIN rolü
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/admin-login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return withSecurityHeaders(NextResponse.redirect(loginUrl))
    }
    try {
      const session = await auth()
      if (session?.user?.role !== 'ADMIN') {
        return withSecurityHeaders(NextResponse.redirect(new URL('/dashboard', req.url)))
      }
    } catch {
      return withSecurityHeaders(NextResponse.redirect(new URL('/admin-login', req.url)))
    }
  }

  // Redirect already-logged-in users away from auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (isLoggedIn) {
      return withSecurityHeaders(NextResponse.redirect(new URL('/dashboard', req.url)))
    }
  }

  const res = withSecurityHeaders(NextResponse.next())
  if (
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/widget') &&
    !pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|js|css|woff|woff2|ttf|apk)$/)
  ) {
    const ctx = detectLocaleContext(req)
    applyLocaleCookies(res, ctx)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|widget\\.js).*)'],
}
