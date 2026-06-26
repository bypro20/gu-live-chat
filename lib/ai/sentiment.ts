import { prisma } from '@/lib/db'
import { getPlatformGeminiKey } from './platform-config'

export type SentimentLabel = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'

const NEGATIVE_PATTERNS = [
  /\b(kötü|berbat|rezalet|iğrenç|sinir|öfke|kızgın|memnun değil|memnuniyetsiz|şikayet|sorun|problem|hata|bozuk|çalışmıyor|iade|iptal|dolandır|saçma|aptal|lanet|kahrol|nefret)\b/i,
  /\b(bad|terrible|awful|angry|frustrated|disappointed|complaint|broken|not working|refund|cancel|hate|worst|useless|scam)\b/i,
]

const POSITIVE_PATTERNS = [
  /\b(teşekkür|teşekkürler|harika|mükemmel|süper|güzel|memnun|yardım|çok iyi|efsane|başarılı)\b/i,
  /\b(thanks|thank you|great|excellent|awesome|perfect|love|happy|helpful|amazing)\b/i,
]

/** Fast rule-based sentiment for visitor messages. Never throws. */
export function analyzeSentiment(text: string): SentimentLabel {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length < 2) return 'NEUTRAL'

  let neg = 0
  let pos = 0
  for (const re of NEGATIVE_PATTERNS) if (re.test(trimmed)) neg++
  for (const re of POSITIVE_PATTERNS) if (re.test(trimmed)) pos++

  if (neg > pos && neg > 0) return 'NEGATIVE'
  if (pos > neg && pos > 0) return 'POSITIVE'
  return 'NEUTRAL'
}

function parseLlmLabel(raw: string): SentimentLabel | null {
  const u = raw.toUpperCase()
  if (u.includes('NEGATIVE') || u.includes('OLUMSUZ')) return 'NEGATIVE'
  if (u.includes('POSITIVE') || u.includes('OLUMLU')) return 'POSITIVE'
  if (u.includes('NEUTRAL') || u.includes('NÖTR')) return 'NEUTRAL'
  return null
}

async function analyzeSentimentLlm(text: string): Promise<SentimentLabel | null> {
  const key = getPlatformGeminiKey()?.trim() || process.env.GEMINI_API_KEY?.trim()
  if (!key || text.length < 3) return null

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(key)}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2500)

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Müşteri mesajının duygusunu sınıflandır. Sadece POSITIVE, NEUTRAL veya NEGATIVE yaz.\n\nMesaj: ${text.slice(0, 500)}`,
              },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 8, temperature: 0 },
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const out = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
    return parseLlmLabel(out)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Rule-based first; optional async LLM refinement in background. */
export async function refineSentimentLater(messageId: string, text: string): Promise<void> {
  const llm = await analyzeSentimentLlm(text)
  if (!llm) return
  const rule = analyzeSentiment(text)
  if (llm === rule && rule !== 'NEUTRAL') return
  if (llm === 'NEUTRAL' && rule !== 'NEUTRAL') return

  await prisma.message.update({
    where: { id: messageId },
    data: { sentiment: llm },
  })
}

export async function resolveSentiment(text: string): Promise<SentimentLabel> {
  const quick = analyzeSentiment(text)
  if (quick !== 'NEUTRAL') return quick
  const llm = await analyzeSentimentLlm(text)
  return llm ?? quick
}
