import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { websiteHasAutoTranslate } from '@/lib/plan-features'
import { sessionIsPlatformAdmin } from '@/lib/platform-admin'
import { translateFast } from '@/lib/translate-engine'
import { normalizeLangCode, resolveSourceLang, isTranslationEngineError } from '@/lib/translate-languages'
import { getWebsiteForMember } from '@/lib/website-member'
import { rateLimitByIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
  }

  const limited = rateLimitByIp(req, 'translate', 60, 60_000)
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec)

  const { text, fromLang, toLang, websiteId } = await req.json()

  if (!text?.trim()) {
    return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 })
  }

  const adminBypass = await sessionIsPlatformAdmin()
  let dbConfig = null

  if (!websiteId && !adminBypass) {
    return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
  }

  if (websiteId && !adminBypass) {
    const website = await getWebsiteForMember(session.user.id, websiteId)
    if (!website) {
      return NextResponse.json({ error: 'Bu siteye erişim izniniz yok' }, { status: 403 })
    }

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
    if (cfg?.apiKey) {
      dbConfig = {
        provider: cfg.provider as 'OPENAI' | 'ANTHROPIC',
        model: cfg.model,
        apiKey: cfg.apiKey,
        temperature: cfg.temperature,
      }
    }
  } else if (websiteId && adminBypass) {
    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true },
    })
    if (website) {
      const cfg = await prisma.aIConfig.findUnique({
        where: { websiteId: website.id },
        select: { provider: true, model: true, apiKey: true, temperature: true },
      })
      if (cfg?.apiKey) {
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
    dbConfig: adminBypass ? dbConfig : null,
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
