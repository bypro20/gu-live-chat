import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { websiteHasAutoTranslate } from '@/lib/plan-features'
import { sessionIsPlatformAdmin } from '@/lib/platform-admin'
import { translateBatch } from '@/lib/translate-engine'
import { normalizeLangCode } from '@/lib/translate-languages'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { texts, fromLang, toLang, websiteId } = await req.json()
  if (!Array.isArray(texts) || texts.length === 0 || texts.length > 20) {
    return NextResponse.json({ error: 'En fazla 20 metin' }, { status: 400 })
  }

  const adminBypass = await sessionIsPlatformAdmin()
  let dbConfig = null

  if (websiteId && !adminBypass) {
    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { id: true, plan: true },
    })
    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }
    const allowed = await websiteHasAutoTranslate(website.id, website.plan)
    if (!allowed) {
      return NextResponse.json({ error: 'PRO gerekli', upgradeRequired: true }, { status: 403 })
    }
  }

  const targetLang = normalizeLangCode(toLang || 'en')
  const sourceLang = fromLang && fromLang !== 'auto' ? normalizeLangCode(fromLang) : undefined

  const results = await translateBatch(
    texts.map((t: string) => String(t).trim()).filter(Boolean),
    targetLang,
    sourceLang,
    dbConfig
  )

  return NextResponse.json({
    translations: results.map((r) => ({
      translatedText: r.translatedText,
      detectedLanguage: r.detectedLanguage,
      available: r.available,
    })),
  })
}
