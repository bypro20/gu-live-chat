import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
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
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|js|css|woff|woff2|ttf)$/)
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
