import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { websiteHasAutoTranslate } from '@/lib/plan-features'
import { sessionIsPlatformAdmin } from '@/lib/platform-admin'
import { translateFast } from '@/lib/translate-engine'
import { normalizeLangCode, resolveSourceLang, isTranslationEngineError } from '@/lib/translate-languages'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
  }

  const { text, fromLang, toLang, websiteId } = await req.json()

  if (!text?.trim()) {
    return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 })
  }

  const adminBypass = await sessionIsPlatformAdmin()
  let dbConfig = null

  if (websiteId && !adminBypass) {
    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, plan: true },
    })
    if (website) {
      const allowed = await websiteHasAutoTranslate(website.id, website.plan)
      if (!allowed) {
        return NextResponse.json(
          {
            error: 'Canlı çeviri PRO plana dahildir',
            upgradeRequired: true,
            translatedText: text,
            available: false,
          },
          { status: 403 }
        )
      }
      const cfg = await prisma.aIConfig.findUnique({
        where: { websiteId: website.id },
        select: { provider: true, model: true, apiKey: true, temperature: true },
      })
      if (cfg) {
        dbConfig = {
          provider: cfg.provider as 'OPENAI' | 'ANTHROPIC',
          model: cfg.model,
          apiKey: cfg.apiKey,
          temperature: cfg.temperature,
        }
      }
    }
  } else if (websiteId) {
    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true },
    })
    if (website) {
      const cfg = await prisma.aIConfig.findUnique({
        where: { websiteId: website.id },
        select: { provider: true, model: true, apiKey: true, temperature: true },
      })
      if (cfg) {
        dbConfig = {
          provider: cfg.provider as 'OPENAI' | 'ANTHROPIC',
          model: cfg.model,
          apiKey: cfg.apiKey,
          temperature: cfg.temperature,
        }
      }
    }
  }

  const targetLang = normalizeLangCode(toLang || 'en')
  const sourceLang = resolveSourceLang(fromLang)

  const result = await translateFast({
    text: text.trim(),
    targetLang,
    sourceLang,
    dbConfig,
  })

  const translatedText =
    result.translatedText && !isTranslationEngineError(result.translatedText)
      ? result.translatedText
      : text.trim()

  return NextResponse.json({
    translatedText,
    detectedLanguage: result.detectedLanguage || sourceLang,
    available: result.available && translatedText !== text.trim(),
    note: result.note,
  })
}
