import { NextRequest, NextResponse } from 'next/server'
import { processIyzicoCallbackToken } from '@/lib/iyzico-process-payment'

function redirectUrl(request: NextRequest, status: 'success' | 'failed', returnTo?: string | null) {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || request.nextUrl.origin
  const path =
    returnTo === 'addons'
      ? `/settings/addons?payment=${status}`
      : `/settings/billing?payment=${status}`
  return NextResponse.redirect(new URL(path, base))
}

async function handleToken(
  request: NextRequest,
  token: string | null,
  returnTo?: string | null
) {
  if (!token) {
    return redirectUrl(request, 'failed', returnTo)
  }

  try {
    const result = await processIyzicoCallbackToken(token)
    if (!result.ok) {
      console.error('[iyzico callback]', result.error)
      return redirectUrl(request, 'failed', returnTo)
    }
    return redirectUrl(request, result.redirect, returnTo)
  } catch (error) {
    console.error('[iyzico callback] Error:', error)
    return redirectUrl(request, 'failed', returnTo)
  }
}

export async function POST(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get('return')
  const formData = await request.formData()
  const token = formData.get('token')?.toString() || null
  return handleToken(request, token, returnTo)
}

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get('return')
  const token = request.nextUrl.searchParams.get('token')
  return handleToken(request, token, returnTo)
}
