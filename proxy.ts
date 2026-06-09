import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
  const ipBlock = await checkIpBan(req)
  if (ipBlock) return ipBlock

  const { pathname } = req.nextUrl

  // Legacy admin login URL alias
  if (pathname === '/panel-giris') {
    return NextResponse.redirect(new URL('/admin-login', req.url))
  }

  // Allow widget routes (public chat widget)
  if (pathname.startsWith('/widget') || pathname.startsWith('/api/widget')) {
    return NextResponse.next()
  }

  // Allow NextAuth routes — auth handles its own security
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|js|css|woff|woff2|ttf|apk)$/)
  ) {
    return NextResponse.next()
  }

  // Check for session cookie (NextAuth v5 uses authjs prefix)
  const sessionToken =
    req.cookies.get('authjs.session-token') ||
    req.cookies.get('__Secure-authjs.session-token') ||
    // NextAuth v4 fallback
    req.cookies.get('next-auth.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token')

  const isLoggedIn = !!sessionToken

  // Protected dashboard/app routes
  const protectedPaths = ['/dashboard', '/inbox', '/settings', '/contacts', '/visitors', '/analytics']
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Admin routes
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/admin-login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect already-logged-in users away from auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|widget\\.js).*)'],
}
