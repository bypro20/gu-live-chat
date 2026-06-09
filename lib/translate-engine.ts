import { translateText, type TranslateParams, type TranslateResult } from '@/lib/ai/translate'

const CACHE_TTL_MS = 10 * 60 * 1000
const MAX_CACHE = 2000

type CacheEntry = { result: TranslateResult; at: number }

const serverCache = new Map<string, CacheEntry>()

function cacheKey(text: string, targetLang: string, sourceLang?: string): string {
  return `${sourceLang || 'auto'}:${targetLang}:${text.slice(0, 500)}`
}

function getCached(key: string): TranslateResult | null {
  const hit = serverCache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    serverCache.delete(key)
    return null
  }
  return hit.result
}

function setCache(key: string, result: TranslateResult): void {
  if (serverCache.size >= MAX_CACHE) {
    const first = serverCache.keys().next().value
    if (first) serverCache.delete(first)
  }
  serverCache.set(key, { result, at: Date.now() })
}

/** Sunucu tarafı hızlı çeviri — önbellek + Google öncelikli motor. */
export async function translateFast(params: TranslateParams): Promise<TranslateResult> {
  const text = (params.text || '').trim()
  if (!text) {
    return { translatedText: '', available: true, detectedLanguage: params.sourceLang }
  }

  const key = cacheKey(text, params.targetLang, params.sourceLang)
  const cached = getCached(key)
  if (cached) return cached

  const result = await translateText(params)
  if (result.available && result.translatedText) {
    setCache(key, result)
  }
  return result
}

export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang?: string,
  dbConfig?: TranslateParams['dbConfig']
): Promise<TranslateResult[]> {
  return Promise.all(
    texts.map((text) =>
      translateFast({ text, targetLang, sourceLang, dbConfig })
    )
  )
}
