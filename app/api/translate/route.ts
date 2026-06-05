import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { text, fromLang, toLang } = await req.json()

  if (!text) {
    return NextResponse.json({ error: 'Metin gerekli' }, { status: 400 })
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
