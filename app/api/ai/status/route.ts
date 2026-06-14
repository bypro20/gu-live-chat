import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getEnvProviderStatus, hasAnyPlatformAiKey, pickDefaultProvider } from '@/lib/ai/provider'

/** GET /api/ai/status — platform AI anahtar durumu (admin only) */
export async function GET() {
  const admin = await requireAdmin()
  if ('error' in admin) return admin.error

  const detail = getEnvProviderStatus()
  const platformReady = hasAnyPlatformAiKey()
  const defaultProvider = pickDefaultProvider()

  return NextResponse.json({
    platformReady,
    defaultProvider,
    providers: detail.effective ?? detail,
    platformFallback: detail.platformFallback,
    native: detail.native,
  })
}
