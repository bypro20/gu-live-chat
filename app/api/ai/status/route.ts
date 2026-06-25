import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getEnvProviderStatus, hasAnyPlatformAiKey, pickDefaultProvider } from '@/lib/ai/provider'
import { isPlatformGeminiConfigured } from '@/lib/ai/platform-config'

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
    geminiConfigured: isPlatformGeminiConfigured(),
    platformEnvKeys: ['GEMINI_API_KEY', 'GOOGLE_AI_API_KEY'],
    providers: detail.effective ?? detail,
    platformFallback: detail.platformFallback,
    native: detail.native,
  })
}
