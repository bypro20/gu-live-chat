import { NextResponse } from 'next/server'
import { getEnvProviderStatus, hasAnyPlatformAiKey, pickDefaultProvider } from '@/lib/ai/provider'

/** GET /api/ai/status — platform AI anahtar durumu (değerler asla döndürülmez) */
export async function GET() {
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
