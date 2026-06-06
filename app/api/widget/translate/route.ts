import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { translateText, isTranslationAvailable } from '@/lib/ai/translate'
import { websiteHasAutoTranslate } from '@/lib/plan-features'
import type { DbAiConfig } from '@/lib/ai/provider'

// Public translation endpoint for the chat widget (visitors are NOT
// authenticated). Scoped to a valid website. Uses lib/ai (OpenAI/Anthropic)
// with a Google Translate fallback. When no engine is configured it returns
// `available: false` so the widget hides its translate UI. Never throws.

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
      return NextResponse.json({ available: false, translatedText: parsed.data.text })
    }

    const dbConfig = await getWebsiteAiConfig(website.id)

    if (!isTranslationAvailable(dbConfig)) {
      return NextResponse.json({
        available: false,
        translatedText: text,
        note: 'Çeviri için AI anahtarı gerekli.',
      })
    }

    const result = await translateText({ text, targetLang, sourceLang, dbConfig })
    return NextResponse.json({
      available: result.available,
      translatedText: result.translatedText,
      detectedLanguage: result.detectedLanguage,
    })
  } catch (error) {
    console.error('Widget translate error:', error)
    // Graceful: never break the chat — report unavailable instead of erroring.
    return NextResponse.json({ available: false, translatedText: '' }, { status: 200 })
  }
}
