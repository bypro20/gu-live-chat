import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { resolveAiConfig, type DbAiConfig } from './provider'

// ─── Real message translation via lib/ai (OpenAI / Anthropic) ───────────
//
// Layered availability:
//   1. An LLM provider key (env or per-website DB) → high quality translation.
//   2. GOOGLE_TRANSLATE_API_KEY → Google Cloud Translation fallback.
//   3. Nothing configured → `available: false` so callers can gracefully hide
//      the translate UI. This module NEVER throws.

export interface TranslateParams {
  text: string
  /** Target language code, e.g. 'tr', 'en', 'de'. */
  targetLang: string
  /** Optional source language code ('auto' or omitted = auto-detect). */
  sourceLang?: string
  /** Optional per-website DB AI config (used only when env keys are absent). */
  dbConfig?: DbAiConfig | null
}

export interface TranslateResult {
  translatedText: string
  /** Whether a translation engine was actually available. */
  available: boolean
  detectedLanguage?: string
  /** Internal note for diagnostics (never user-facing secrets). */
  note?: string
}

const MAX_TOKENS = 1000

const LANG_NAMES: Record<string, string> = {
  tr: 'Türkçe',
  en: 'İngilizce',
  de: 'Almanca',
  fr: 'Fransızca',
  es: 'İspanyolca',
  it: 'İtalyanca',
  pt: 'Portekizce',
  ru: 'Rusça',
  ar: 'Arapça',
  fa: 'Farsça',
  zh: 'Çince',
  ja: 'Japonca',
  ko: 'Korece',
  hi: 'Hintçe',
  ur: 'Urduca',
  bn: 'Bengalce',
  id: 'Endonezce',
  ms: 'Malayca',
  tl: 'Filipince',
  vi: 'Vietnamca',
  th: 'Tayca',
  nl: 'Felemenkçe',
  pl: 'Lehçe',
  uk: 'Ukraynaca',
  el: 'Yunanca',
  ro: 'Romence',
  bg: 'Bulgarca',
  cs: 'Çekçe',
  sk: 'Slovakça',
  hu: 'Macarca',
  sv: 'İsveççe',
  no: 'Norveççe',
  fi: 'Fince',
  da: 'Danca',
  he: 'İbranice',
  sr: 'Sırpça',
  hr: 'Hırvatça',
  sl: 'Slovence',
  az: 'Azerice',
  kk: 'Kazakça',
  hy: 'Ermenice',
  ka: 'Gürcüce',
  et: 'Estonca',
  lt: 'Litvanca',
  lv: 'Letonca',
}

function langName(code: string): string {
  return LANG_NAMES[code?.toLowerCase?.()] || code
}

/** True when any translation engine (LLM or Google) is reachable. */
export function isTranslationAvailable(db?: DbAiConfig | null): boolean {
  if (resolveAiConfig(db) !== null) return true
  if (process.env.GOOGLE_TRANSLATE_API_KEY?.trim()) return true
  return false
}

async function translateWithLlm(
  params: TranslateParams,
  runtime: NonNullable<ReturnType<typeof resolveAiConfig>>
): Promise<string | null> {
  const target = langName(params.targetLang)
  const system =
    `Sen profesyonel bir çeviri motorusun. Verilen metni ${target} diline çevir. ` +
    `Yalnızca çeviriyi döndür; açıklama, tırnak veya ek metin ekleme. ` +
    `Metin zaten ${target} dilindeyse aynen geri döndür. Anlam, ton ve biçimlendirmeyi koru.`
  const user = params.text

  try {
    if (runtime.provider === 'OPENAI') {
      const client = new OpenAI({ apiKey: runtime.apiKey })
      const completion = await client.chat.completions.create({
        model: runtime.model,
        temperature: 0.2,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      })
      return completion.choices[0]?.message?.content?.trim() || null
    }

    const client = new Anthropic({ apiKey: runtime.apiKey })
    const resp = await client.messages.create({
      model: runtime.model,
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      system,
      messages: [{ role: 'user', content: user }],
    })
    const block = resp.content.find((b) => b.type === 'text')
    return block && 'text' in block ? block.text.trim() : null
  } catch {
    console.error('[AI Translate] LLM call failed.')
    return null
  }
}

async function translateWithGoogle(params: TranslateParams): Promise<{ text: string; detected?: string } | null> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY?.trim()
  if (!apiKey) return null
  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: params.text,
          target: params.targetLang || 'tr',
          ...(params.sourceLang && params.sourceLang !== 'auto' ? { source: params.sourceLang } : {}),
          format: 'text',
        }),
      }
    )
    const data = await res.json()
    if (data.error) {
      console.error('[AI Translate] Google error.')
      return null
    }
    const t = data.data?.translations?.[0]
    if (!t) return null
    return { text: t.translatedText, detected: t.detectedSourceLanguage }
  } catch {
    console.error('[AI Translate] Google fetch failed.')
    return null
  }
}

/**
 * Translates `text` into `targetLang`. Prefers an LLM provider, falls back to
 * Google, and finally returns `available: false` (original text echoed) when no
 * engine is configured. Never throws.
 */
export async function translateText(params: TranslateParams): Promise<TranslateResult> {
  const text = (params.text || '').trim()
  if (!text) {
    return { translatedText: '', available: isTranslationAvailable(params.dbConfig) }
  }

  const runtime = resolveAiConfig(params.dbConfig)
  if (runtime) {
    const llm = await translateWithLlm(params, runtime)
    if (llm) {
      return { translatedText: llm, available: true, detectedLanguage: params.sourceLang || 'auto' }
    }
    // LLM failed — try Google before giving up.
  }

  const google = await translateWithGoogle(params)
  if (google) {
    return { translatedText: google.text, available: true, detectedLanguage: google.detected }
  }

  // Nothing configured (or all engines failed): echo original, mark unavailable.
  return {
    translatedText: text,
    available: false,
    note: 'Çeviri için bir AI anahtarı (OpenAI/Anthropic) veya GOOGLE_TRANSLATE_API_KEY gerekli.',
  }
}
