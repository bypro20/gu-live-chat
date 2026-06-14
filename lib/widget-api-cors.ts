import { NextResponse } from 'next/server'

/** Müşteri sitelerinden (myqar.net vb.) widget.js XHR çağrıları için CORS */
export function widgetApiCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin')
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  }
}

export function withWidgetApiCors<T>(request: Request, response: NextResponse<T>) {
  for (const [key, value] of Object.entries(widgetApiCorsHeaders(request))) {
    response.headers.set(key, value)
  }
  return response
}

export function widgetApiOptionsResponse(request: Request) {
  return new NextResponse(null, { status: 204, headers: widgetApiCorsHeaders(request) })
}
