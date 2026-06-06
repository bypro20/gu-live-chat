import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PLAN_LIMITS } from '@/lib/constants'

export async function POST(req: Request) {
  // Auth required — this endpoint uses server-side API keys
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Oturum açmanız gerekiyor' }, { status: 401 })
  }

  const { text, fromLang, toLang, websiteId } = await req.json()

  if (!text) {
    return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 })
  }

  // Plan gate: autoTranslate feature required (check active website when provided)
  if (websiteId) {
    const website = await prisma.website.findUnique({
      where: { websiteId },
      select: { plan: true },
    })
    if (website && !PLAN_LIMITS[website.plan].autoTranslate) {
      return NextResponse.json(
        { error: 'Otomatik çeviri bu plan kapsamında mevcut değil', translatedText: text },
        { status: 403 }
      )
    }
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY

  if (apiKey) {
    try {
      const res = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text,
            target: toLang || 'tr',
            ...(fromLang && fromLang !== 'auto' ? { source: fromLang } : {}),
            format: 'text',
          }),
        }
      )

      const data = await res.json()

      if (data.error) {
        console.error('[Translate API] Google error:', data.error)
        return NextResponse.json({
          translatedText: text,
          detectedLanguage: fromLang || 'tr',
          note: 'Google Çeviri API hatası, orijinal metin gösteriliyor',
        })
      }

      const translatedText = data.data?.translations?.[0]?.translatedText || text
      const detectedLanguage = data.data?.translations?.[0]?.detectedSourceLanguage || fromLang || 'tr'

      return NextResponse.json({ translatedText, detectedLanguage })
    } catch (error) {
      console.error('[Translate API] Error:', error)
      return NextResponse.json({
        translatedText: text,
        detectedLanguage: fromLang || 'tr',
        note: 'Çeviri hatası, orijinal metin gösteriliyor',
      })
    }
  }

  return NextResponse.json({
    translatedText: text,
    detectedLanguage: fromLang || 'tr',
    note: 'Google Çeviri API anahtarı ayarlanmamış. GOOGLE_TRANSLATE_API_KEY ortam değişkenini ekleyin.',
  })
}
