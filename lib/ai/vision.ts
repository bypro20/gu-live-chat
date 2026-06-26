import { getPlatformGeminiKey } from './platform-config'

/** Describe an image URL for support context (Gemini vision). */
export async function describeImageUrl(imageUrl: string, question?: string): Promise<string | null> {
  const key = getPlatformGeminiKey()?.trim() || process.env.GEMINI_API_KEY?.trim()
  if (!key || !imageUrl.trim()) return null

  try {
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(8000) })
    if (!imgRes.ok) return null
    const buf = Buffer.from(await imgRes.arrayBuffer())
    const mime = imgRes.headers.get('content-type') || 'image/jpeg'
    const b64 = buf.toString('base64')

    const prompt =
      question?.trim() ||
      'Bu görseli müşteri destek bağlamında Türkçe kısa özetle: ne görünüyor, olası sorun veya talep ne?'

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType: mime.split(';')[0], data: b64 } },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 320, temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) return null
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
  } catch {
    return null
  }
}
