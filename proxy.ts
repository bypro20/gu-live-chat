import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow widget, API routes (auth handles its own), and static files
  if (pathname.startsWith('/widget') || pathname.startsWith('/api/widget') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Allow static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionToken = req.cookies.get('authjs.session-token') || req.cookies.get('__Secure-authjs.session-token')
  const isLoggedIn = !!sessionToken

  // Protected routes - redirect to login if no session cookie
  const protectedPaths = ['/dashboard', '/inbox', '/settings', '/contacts', '/visitors']

  // Regular protected routes
  if (protectedPaths.some(p => pathname.startsWith(p))) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Admin routes - redirect to admin login (but NOT /admin-login itself)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/admin-login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect logged-in users from auth pages (but NOT /admin-login)
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public|widget.js).*)'],
}