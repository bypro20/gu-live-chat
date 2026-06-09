'use client'

const clientCache = new Map<string, string>()
const MAX_CLIENT_CACHE = 500

function clientKey(text: string, to: string, from?: string): string {
  return `${from || 'auto'}:${to}:${text}`
}

export type ClientTranslateResult = {
  translatedText: string
  detectedLanguage?: string
  available?: boolean
  upgradeRequired?: boolean
}

export async function translateClient(opts: {
  text: string
  toLang: string
  fromLang?: string
  websiteId?: string
  endpoint?: '/api/translate' | '/api/widget/translate'
}): Promise<ClientTranslateResult> {
  const text = opts.text.trim()
  if (!text) return { translatedText: '' }

  const key = clientKey(text, opts.toLang, opts.fromLang)
  const hit = clientCache.get(key)
  if (hit) return { translatedText: hit, available: true }

  const endpoint = opts.endpoint || '/api/translate'
  const body =
    endpoint === '/api/widget/translate'
      ? {
          websiteId: opts.websiteId,
          text,
          targetLang: opts.toLang,
          sourceLang: opts.fromLang,
        }
      : {
          text,
          toLang: opts.toLang,
          fromLang: opts.fromLang,
          websiteId: opts.websiteId,
        }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: endpoint === '/api/translate' ? 'include' : 'omit',
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok && !data.translatedText) {
    return {
      translatedText: text,
      available: false,
      upgradeRequired: data.upgradeRequired,
    }
  }

  const translated = (data.translatedText as string) || text
  if (data.available !== false && translated !== text) {
    if (clientCache.size >= MAX_CLIENT_CACHE) {
      const first = clientCache.keys().next().value
      if (first) clientCache.delete(first)
    }
    clientCache.set(key, translated)
  }

  return {
    translatedText: translated,
    detectedLanguage: data.detectedLanguage,
    available: data.available !== false,
    upgradeRequired: data.upgradeRequired,
  }
}

export async function detectLanguageClient(
  text: string,
  websiteId?: string
): Promise<string | null> {
  const sample = text.trim().slice(0, 280)
  if (!sample) return null
  const res = await translateClient({
    text: sample,
    toLang: 'en',
    fromLang: 'auto',
    websiteId,
  })
  return res.detectedLanguage || null
}
