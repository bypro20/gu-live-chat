import { NextRequest, NextResponse } from 'next/server'
import { verifyCronRequest } from '@/lib/cron-auth'
import {
  generateAiReply,
  getEnvProviderStatus,
  hasAnyPlatformAiKey,
  isAiLlmAvailable,
  probeGeminiConnection,
} from '@/lib/ai/provider'

function authorizeCron(request: NextRequest): NextResponse | null {
  const authError = verifyCronRequest(request)
  if (authError) return authError

  return null
}

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-pro',
  'gemini-3.1-flash-lite',
] as const

/** GET /api/cron/ai-smoke-test — platform AI anahtarlarını canlı dener */
export async function GET(request: NextRequest) {
  const denied = authorizeCron(request)
  if (denied) return denied

  const providers = getEnvProviderStatus()
  const platformReady = hasAnyPlatformAiKey()

  if (!platformReady) {
    return NextResponse.json({ ok: false, platformReady, providers }, { status: 503 })
  }

  let geminiProbe: { ok: boolean; error?: string; model?: string } = { ok: false }
  for (const model of GEMINI_MODELS) {
    const probe = await probeGeminiConnection(model)
    if (probe.ok) {
      geminiProbe = { ok: true, model }
      break
    }
    geminiProbe = { ok: false, error: probe.error, model }
  }

  try {
    const dbConfig = geminiProbe.ok && geminiProbe.model
      ? { provider: 'GEMINI' as const, model: geminiProbe.model, apiKey: null, temperature: 0.7 }
      : null

    const reply = await generateAiReply({
      siteName: 'Gu Live Chat Test',
      messages: [{ role: 'user', content: 'Fiyatlarınız hakkında kısa bilgi verir misiniz?' }],
      plan: 'PRO',
      dbConfig,
    })

    const fallbackMarkers = ['Mesajınızı aldım', 'Kısa süre içinde size dönüş']
    const usedFallback = fallbackMarkers.some((m) => reply.includes(m))
    const llmAvailable = isAiLlmAvailable(dbConfig)
    const ok = geminiProbe.ok && llmAvailable && reply.length > 20 && !usedFallback

    return NextResponse.json({
      ok,
      platformReady,
      providers,
      geminiProbe,
      replyPreview: reply.slice(0, 200),
      mode: ok ? 'llm' : usedFallback ? 'fallback' : 'unknown',
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        platformReady,
        providers,
        geminiProbe,
        error: error instanceof Error ? error.message : 'Test failed',
      },
      { status: 500 }
    )
  }
}
