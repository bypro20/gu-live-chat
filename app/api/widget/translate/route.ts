import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { translateFast } from '@/lib/translate-engine'
import { websiteHasAutoTranslate } from '@/lib/plan-features'
import { isTranslationAvailable } from '@/lib/ai/translate'
import { normalizeLangCode, resolveSourceLang, isTranslationEngineError, detectLanguageHint, languagesDiffer } from '@/lib/translate-languages'
import type { DbAiConfig } from '@/lib/ai/provider'
import { rateLimitByIp, rateLimitResponse } from '@/lib/rate-limit'

const schema = z.object({
  websiteId: z.string(),
  text: z.string().min(1).max(5000),
  targetLang: z.string().min(2).max(8),
  sourceLang: z.string().min(2).max(8).optional(),
})

async function getWebsiteAiConfig(websiteDbId: string): Promise<DbAiConfig | null> {
  try {
    const cfg = await prisma.aIConfig.findFirst({
      where: { websiteId: websiteDbId },
      select: { provider: true, model: true, apiKey: true, temperature: true },
    })
    if (!cfg) return null
    return {
      provider: cfg.provider as DbAiConfig['provider'],
      model: cfg.model ?? null,
      apiKey: cfg.apiKey ?? null,
      temperature: cfg.temperature ?? null,
    }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const limited = rateLimitByIp(req, 'widget-translate', 40, 60_000)
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Geçersiz veri', available: false }, { status: 400 })
    }
    const { websiteId, text, targetLang, sourceLang } = parsed.data

    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, plan: true },
    })
    if (!website) {
      return NextResponse.json({ error: 'Website bulunamadı', available: false }, { status: 404 })
    }

    const translateAllowed = await websiteHasAutoTranslate(website.id, website.plan)
    if (!translateAllowed) {
      return NextResponse.json({
        available: false,
        translatedText: text,
        upgradeRequired: true,
      })
    }

    const dbConfig = await getWebsiteAiConfig(website.id)
    if (!isTranslationAvailable(dbConfig)) {
      return NextResponse.json({ available: false, translatedText: text })
    }

    const target = normalizeLangCode(targetLang)
    const srcHint = resolveSourceLang(sourceLang) || detectLanguageHint(text)
    if (!languagesDiffer(srcHint, target)) {
      return NextResponse.json({
        available: true,
        translatedText: text,
        sameLanguage: true,
        detectedLanguage: srcHint,
      })
    }

    const result = await translateFast({
      text,
      targetLang: normalizeLangCode(targetLang),
      sourceLang: resolveSourceLang(sourceLang),
      dbConfig,
    })

    const translatedText =
      result.translatedText && !isTranslationEngineError(result.translatedText)
        ? result.translatedText
        : text

    return NextResponse.json({
      available: result.available !== false,
      translatedText,
      detectedLanguage: result.detectedLanguage,
      sameLanguage: translatedText === text,
    })
  } catch (error) {
    console.error('Widget translate error:', error)
    return NextResponse.json({ available: false, translatedText: '' }, { status: 200 })
  }
}
