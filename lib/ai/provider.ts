import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import type { PlanType } from '@/lib/constants'
import { DEFAULT_MODEL } from './models'
import { clampModelToPlan } from './plan-models'
import { selectRelevantKnowledge } from './knowledge-legacy'
import { pickRoutedModel } from './smart-routing'
import { fetchWebContext } from './web-search'
import {
  buildGeminiFallbackRuntime,
  canUsePlatformFallback,
  clampRequestedForPlan,
} from './platform-router'
import { getPlatformGeminiKey, isPlatformGeminiConfigured } from './platform-config'

// ─── Types ──────────────────────────────────────────────────────────

export type AiProvider = 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'GROQ' | 'OPENROUTER' | 'OLLAMA'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface KnowledgeEntry {
  title: string
  content: string
}

export interface DbAiConfig {
  provider: AiProvider
  model: string | null
  apiKey: string | null
  temperature: number | null
}

export interface AiRuntimeConfig {
  provider: AiProvider
  apiKey: string
  model: string
  temperature: number
  source: 'env' | 'db'
  baseURL?: string
  extraHeaders?: Record<string, string>
  /** Platform yedek: kullanıcı farklı sağlayıcı seçmiş, Gemini ile karşılandı */
  platformFallback?: boolean
  requestedProvider?: AiProvider
}

export interface GenerateAiReplyParams {
  siteName: string
  messages: ChatMessage[]
  knowledge?: KnowledgeEntry[]
  systemPrompt?: string
  dbConfig?: DbAiConfig | null
  /** Paket sınırına göre modeli düşürmek için */
  plan?: PlanType
  websiteId?: string
  conversationId?: string
  visitorContext?: string
  /** DuckDuckGo ile güncel web bağlamı ekle */
  webSearchEnabled?: boolean
  /** Karmaşık sorularda economy → standard model seçimi */
  smartRoutingEnabled?: boolean
  /** Yanıt uzunluğu sınırı — widget auto-reply için düşük tutulabilir */
  maxTokens?: number
  /** Fallback metinlerinde "<marka> ekibinden" demek için (örn. "Gu Live Chat"). */
  brandName?: string
}

const MAX_TOKENS = 1024

/**
 * Ücretsiz katmanda her Gemini modelinin AYRI kotası vardır. Biri 429
 * (kota doldu) verince sıradaki modele geçeriz → ödeme olmadan ~4 kat kapasite.
 * Hızlı/ucuz modeller önce.
 */
const GEMINI_FREE_FALLBACK_CHAIN = [
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
]

/** İstenen modeli başa alıp ardından yedek zinciri ekler (tekrarsız). */
function geminiModelCandidates(primary: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of [primary, ...GEMINI_FREE_FALLBACK_CHAIN]) {
    const name = m?.trim()
    if (name && !seen.has(name)) {
      seen.add(name)
      out.push(name)
    }
  }
  return out
}

const ENV_KEYS: Partial<Record<AiProvider, string | undefined>> = {
  OPENAI: process.env.OPENAI_API_KEY,
  ANTHROPIC: process.env.ANTHROPIC_API_KEY,
  GEMINI: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
  GROQ: process.env.GROQ_API_KEY,
  OPENROUTER: process.env.OPENROUTER_API_KEY,
  OLLAMA: process.env.OLLAMA_API_KEY || 'ollama',
}

function ollamaBaseUrl() {
  const raw = process.env.OLLAMA_BASE_URL?.trim()
  if (!raw) return null
  return raw.endsWith('/v1') ? raw : `${raw.replace(/\/$/, '')}/v1`
}

// ─── Env / provider discovery ───────────────────────────────────────

function geminiKey() {
  return getPlatformGeminiKey()
}

export function hasAnyPlatformAiKey(): boolean {
  if (pickDefaultProvider() !== null) return true
  return isPlatformGeminiConfigured()
}

export function getEnvProviderStatus() {
  const native = {
    openai: !!ENV_KEYS.OPENAI?.trim(),
    anthropic: !!ENV_KEYS.ANTHROPIC?.trim(),
    gemini: !!geminiKey(),
    groq: !!ENV_KEYS.GROQ?.trim(),
    openrouter: !!ENV_KEYS.OPENROUTER?.trim(),
    ollama: !!ollamaBaseUrl(),
  }
  const platformFallback = !!geminiKey()
  return {
    ...native,
    /** Gerçek API anahtarı yoksa Gemini platform yedek ile çalışır */
    effective: {
      openai: native.openai || platformFallback,
      anthropic: native.anthropic || platformFallback,
      gemini: native.gemini,
      groq: native.groq || platformFallback,
      openrouter: native.openrouter || platformFallback,
      ollama: native.ollama || platformFallback,
    },
    platformFallback,
    native,
  }
}

export function pickDefaultProvider(): AiProvider | null {
  const order: AiProvider[] = ['GEMINI', 'OPENROUTER', 'GROQ', 'OPENAI', 'ANTHROPIC', 'OLLAMA']
  for (const p of order) {
    if (p === 'OLLAMA') {
      if (ollamaBaseUrl()) return p
      continue
    }
    if (ENV_KEYS[p]?.trim()) return p
  }
  return null
}

function runtimeForProvider(provider: AiProvider, db: DbAiConfig | null | undefined, temperature: number): AiRuntimeConfig | null {
  if (provider === 'OLLAMA') {
    const baseURL = ollamaBaseUrl()
    if (!baseURL) return null
    return {
      provider: 'OLLAMA',
      apiKey: ENV_KEYS.OLLAMA?.trim() || 'ollama',
      model: db?.model || DEFAULT_MODEL.OLLAMA,
      temperature,
      source: 'env',
      baseURL,
    }
  }

  const key = ENV_KEYS[provider]?.trim()
  if (!key) return null

  const cfg: AiRuntimeConfig = {
    provider,
    apiKey: key,
    model: db?.model || DEFAULT_MODEL[provider],
    temperature,
    source: 'env',
  }

  if (provider === 'GROQ') cfg.baseURL = 'https://api.groq.com/openai/v1'
  if (provider === 'OPENROUTER') {
    cfg.baseURL = 'https://openrouter.ai/api/v1'
    cfg.extraHeaders = {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://gulivechat.com',
      'X-Title': 'Gu Live Chat',
    }
  }

  return cfg
}

function runtimeWithPlatformFallback(
  provider: AiProvider,
  db: DbAiConfig | null | undefined,
  temperature: number,
  plan?: PlanType
): AiRuntimeConfig | null {
  const requestedModel = db?.model || DEFAULT_MODEL[provider]
  const clamped = plan
    ? clampRequestedForPlan(plan, provider, requestedModel)
    : { provider, model: requestedModel }

  const native = runtimeForProvider(
    clamped.provider,
    { provider: clamped.provider, model: clamped.model, apiKey: db?.apiKey ?? null, temperature: db?.temperature ?? null },
    temperature
  )
  if (native) return native

  const gKey = geminiKey()
  if (!canUsePlatformFallback(clamped.provider, gKey)) return null

  const fallback = buildGeminiFallbackRuntime(
    clamped.provider,
    clamped.model,
    gKey,
    temperature
  )
  const geminiClamped = plan
    ? clampModelToPlan(plan, 'GEMINI', fallback.model)
    : { provider: 'GEMINI' as AiProvider, model: fallback.model }

  return {
    provider: 'GEMINI',
    apiKey: gKey,
    model: geminiClamped.model,
    temperature,
    source: 'env',
    platformFallback: true,
    requestedProvider: clamped.provider,
  }
}

export function resolveAiConfig(
  db?: DbAiConfig | null,
  plan?: PlanType
): AiRuntimeConfig | null {
  const temperature = db?.temperature ?? 0.75
  const preferred = db?.provider

  const applyPlan = (cfg: AiRuntimeConfig): AiRuntimeConfig => {
    if (!plan) return cfg
    const clamped = clampModelToPlan(plan, cfg.provider, cfg.model)
    return { ...cfg, provider: clamped.provider, model: clamped.model }
  }

  if (preferred) {
    const cfg = runtimeWithPlatformFallback(preferred, db, temperature, plan)
    if (cfg) return applyPlan(cfg)
  }

  for (const provider of ['GEMINI', 'OPENROUTER', 'GROQ', 'OPENAI', 'ANTHROPIC', 'OLLAMA'] as AiProvider[]) {
    const cfg = runtimeWithPlatformFallback(provider, db, temperature, plan)
    if (cfg) return applyPlan(cfg)
  }

  if (db?.apiKey?.trim()) {
    const provider = db.provider
    const raw: AiRuntimeConfig = {
      provider,
      apiKey: db.apiKey.trim(),
      model: db.model || DEFAULT_MODEL[provider],
      temperature,
      source: 'db',
    }
    return applyPlan(raw)
  }

  return null
}

export function isAiLlmAvailable(db?: DbAiConfig | null): boolean {
  return resolveAiConfig(db) !== null
}

/** Canlı Gemini bağlantı testi — hata mesajı döner, anahtar asla sızmaz. */
export async function probeGeminiConnection(model = 'gemini-2.5-flash'): Promise<{ ok: boolean; error?: string }> {
  const key = geminiKey()
  if (!key) return { ok: false, error: 'GEMINI_API_KEY missing' }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 16 },
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `${res.status}: ${err.slice(0, 300)}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'fetch failed' }
  }
}

// ─── System prompt ──────────────────────────────────────────────────

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max) + '…' : clean
}

function knowledgeToText(knowledge?: KnowledgeEntry[]): string {
  if (!knowledge || knowledge.length === 0) return ''
  return knowledge
    .slice(0, 16)
    .map((k, i) => `${i + 1}. ${k.title}\n${truncate(k.content, 700)}`)
    .join('\n\n')
}

function buildSystemPrompt(
  siteName: string,
  knowledge?: KnowledgeEntry[],
  custom?: string,
  visitorContext?: string
): string {
  const base =
    custom?.trim() ||
    `Sen ${siteName} markasının deneyimli müşteri destek temsilcisisin. Gerçek bir insan gibi yaz:
- Türkçe, doğal ve akıcı konuş; kısa paragraflar, gerektiğinde madde işaretleri kullan.
- Ziyaretçinin sorusunu anladığını göster, empati kur, net ve mantıklı cevap ver.
- Bilmediğin konuda uydurma; "bu konuda sizi canlı temsilcimize aktarayım" gibi doğal geçiş yap.
- Satış veya bilgi talebinde nazikçe yönlendir, faydayı vurgula ama baskıcı olma.
- "yapay zeka", "bot", "asistan", "LLM" kelimelerini kullanma — sen destek ekibindensin.
- Her yanıt soruya özel olsun; önceki mesajlardaki cümleleri ve kalıpları tekrarlama.
- "Mesajınızı aldım", "kısa süre içinde dönüş yapacağız" gibi şablon cümleler kullanma.
- Her yanıt 1-4 cümle olsun; gereksiz uzatma.`

  let prompt = base
  if (visitorContext?.trim()) {
    prompt += `\n\nZiyaretçi bağlamı: ${visitorContext.trim()}`
  }

  const kb = knowledgeToText(knowledge)
  if (kb) {
    prompt +=
      `\n\n${siteName} bilgi tabanı (soruyla ilgiliyse bunlara dayan, metni kopyalama — kendi cümlelerinle anlat):\n\n${kb}`
  }
  return prompt
}

// ─── Rule / knowledge-based fallback (no API key) ───────────────────

const TR_STOPWORDS = new Set([
  've', 'veya', 'ile', 'bir', 'bu', 'şu', 'için', 'mi', 'mı', 'mu', 'mü', 'ne',
  'nasıl', 'nedir', 'ben', 'sen', 'biz', 'siz', 'da', 'de', 'ki', 'ya', 'çok',
  'daha', 'en', 'gibi', 'kadar', 'ama', 'fakat', 'ise', 'her', 'hiç', 'olan',
  'var', 'yok', 'the', 'a', 'an', 'is', 'are', 'to', 'of', 'and', 'or',
])

function normalizeTr(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(s: string): string[] {
  return normalizeTr(s)
    .split(' ')
    .filter((t) => t.length > 2 && !TR_STOPWORDS.has(t))
}

const GREETING_RE = /\b(merhaba|selam|selamlar|iyi günler|günaydın|iyi akşamlar|hello|hi|hey)\b/i
const THANKS_RE = /\b(teşekkür|teşekkürler|sağ ?ol|eyvallah|thanks|thank you)\b/i

export function fallbackReply(
  siteName: string,
  messages: ChatMessage[],
  knowledge?: KnowledgeEntry[],
  brandName?: string,
): string {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content?.trim() || ''
  const agent = (siteName || 'Destek').trim().split(/\s+/)[0] || 'Destek'
  const brand = brandName?.trim() || ''
  const teamSuffix = brand ? `${brand} ekibinden` : 'destek ekibinden'
  // Aynı cümlenin sürekli tekrarını azaltmak için konuşma uzunluğuna göre döndür.
  const variantIdx = Math.max(0, messages.length) % 3

  if (!lastUser) {
    const welcomes = [
      `Merhaba! Ben ${agent}, ${teamSuffix}. Size nasıl yardımcı olabilirim?`,
      `Selam, hoş geldiniz! Ben ${agent}, ${teamSuffix}. Aklınıza takılan ne varsa sorabilirsiniz.`,
      `Merhaba 👋 Ben ${agent}, ${teamSuffix}. Bugün nasıl yardımcı olayım?`,
    ]
    return welcomes[variantIdx]
  }

  if (GREETING_RE.test(lastUser) && lastUser.length < 40) {
    const greets = [
      `Merhaba! Ben ${agent}, ${teamSuffix}. Nasıl yardımcı olabilirim?`,
      `Selam, hoş geldiniz! Ben ${agent}, ${teamSuffix} — ne sormak istersiniz?`,
      `Merhaba 👋 ${brand ? brand + ' ' : ''}için buradayım. Size nasıl yardımcı olayım?`,
    ]
    return greets[variantIdx]
  }

  if (THANKS_RE.test(lastUser) && lastUser.length < 40) {
    const thanks = [
      `Rica ederim! Başka bir sorunuz olursa buradayım.`,
      `Ne demek, her zaman! Yardımcı olabileceğim başka bir şey var mı?`,
      `Rica ederim 🙂 Aklınıza başka bir şey takılırsa çekinmeden yazın.`,
    ]
    return thanks[variantIdx]
  }

  if (knowledge && knowledge.length > 0) {
    const relevant = selectRelevantKnowledge(lastUser, knowledge, 3)
    if (relevant.length > 0) {
      const top = relevant[0]
      const snippet = truncate(top.content, 480)
      if (relevant.length === 1) {
        return snippet
      }
      return `${snippet}\n\nİsterseniz ${relevant.slice(1, 3).map((k) => k.title.toLowerCase()).join(' veya ')} hakkında da bilgi verebilirim.`
    }

    const queryTokens = new Set(tokenize(lastUser))
    if (queryTokens.size > 0) {
      let best: { entry: KnowledgeEntry; score: number } | null = null
      for (const entry of knowledge) {
        const entryTokens = tokenize(`${entry.title} ${entry.content}`)
        let score = 0
        for (const t of entryTokens) if (queryTokens.has(t)) score++
        if (!best || score > best.score) best = { entry, score }
      }
      if (best && best.score >= 1) {
        return truncate(best.entry.content, 480)
      }
    }
  }

  const topic = brand || siteName
  return `${topic} hakkında fiyat, kurulum, WhatsApp entegrasyonu veya paketlerle ilgili merak ettiğinizi yazın, hemen yardımcı olayım.`
}

// ─── Provider calls ─────────────────────────────────────────────────

async function callOpenAiCompat(runtime: AiRuntimeConfig, systemPrompt: string, messages: ChatMessage[], maxTokens = MAX_TOKENS): Promise<string> {
  const client = new OpenAI({
    apiKey: runtime.apiKey,
    baseURL: runtime.baseURL,
    defaultHeaders: runtime.extraHeaders,
  })
  const completion = await client.chat.completions.create({
    model: runtime.model,
    temperature: runtime.temperature,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  })
  return completion.choices[0]?.message?.content?.trim() || ''
}

async function callAnthropic(runtime: AiRuntimeConfig, systemPrompt: string, messages: ChatMessage[], maxTokens = MAX_TOKENS): Promise<string> {
  const client = new Anthropic({ apiKey: runtime.apiKey })
  const resp = await client.messages.create({
    model: runtime.model,
    max_tokens: maxTokens,
    temperature: runtime.temperature,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })
  const textBlock = resp.content.find((b) => b.type === 'text')
  return textBlock && 'text' in textBlock ? textBlock.text.trim() : ''
}

async function callGemini(runtime: AiRuntimeConfig, systemPrompt: string, messages: ChatMessage[], maxTokens = MAX_TOKENS): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(runtime.model)}:generateContent?key=${encodeURIComponent(runtime.apiKey)}`

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: runtime.temperature,
        maxOutputTokens: maxTokens,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${res.status} ${err.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

async function callLlm(runtime: AiRuntimeConfig, systemPrompt: string, messages: ChatMessage[], maxTokens = MAX_TOKENS): Promise<string> {
  switch (runtime.provider) {
    case 'ANTHROPIC':
      return callAnthropic(runtime, systemPrompt, messages, maxTokens)
    case 'GEMINI':
      return callGemini(runtime, systemPrompt, messages, maxTokens)
    case 'OPENAI':
    case 'GROQ':
    case 'OPENROUTER':
    case 'OLLAMA':
      return callOpenAiCompat(runtime, systemPrompt, messages, maxTokens)
    default:
      return ''
  }
}

// ─── Streaming provider calls ───────────────────────────────────────

/** Gemini token akışı (SSE). Her parça ham metin olarak yield edilir. */
async function* callGeminiStream(
  runtime: AiRuntimeConfig,
  systemPrompt: string,
  messages: ChatMessage[],
  maxTokens = MAX_TOKENS,
): AsyncGenerator<string, void, unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(runtime.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(runtime.apiKey)}`

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: runtime.temperature,
        maxOutputTokens: maxTokens,
      },
    }),
  })

  if (!res.ok || !res.body) {
    const err = await res.text().catch(() => '')
    throw new Error(`Gemini stream error: ${res.status} ${err.slice(0, 200)}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let nl: number
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim()
      buffer = buffer.slice(nl + 1)
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      try {
        const json = JSON.parse(payload) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
        }
        const text = (json.candidates?.[0]?.content?.parts ?? [])
          .map((p) => p.text || '')
          .join('')
        if (text) yield text
      } catch {
        // kısmi/eksik JSON satırı — atla
      }
    }
  }
}

/**
 * Gerçek token akışı ile yanıt üretir. Gemini SSE ile parça parça gelir;
 * diğer sağlayıcılarda tek seferde tam metin yield edilir. Hata/anahtar
 * yoksa kural tabanlı fallback metni yield edilir (her zaman bir yanıt döner).
 */
export async function* generateAiReplyStream(
  params: GenerateAiReplyParams,
): AsyncGenerator<string, void, unknown> {
  const { siteName, messages, knowledge } = params

  if (!messages || messages.length === 0) {
    yield fallbackReply(siteName, [], knowledge, params.brandName)
    return
  }

  const runtime = resolveAiConfig(params.dbConfig, params.plan)
  if (!runtime) {
    yield fallbackReply(siteName, messages, knowledge, params.brandName)
    return
  }

  const routedModel =
    params.smartRoutingEnabled === false
      ? runtime.model
      : pickRoutedModel(runtime.provider, runtime.model, messages)
  const activeRuntime = routedModel === runtime.model ? runtime : { ...runtime, model: routedModel }

  let enrichedContext = params.visitorContext
  if (params.webSearchEnabled) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
    const web = await fetchWebContext(lastUser)
    if (web) {
      enrichedContext = [enrichedContext, `Güncel web bilgisi (doğrula, uydurma):\n${web}`]
        .filter(Boolean)
        .join('\n\n')
    }
  }

  const systemPrompt = buildSystemPrompt(siteName, knowledge, params.systemPrompt, enrichedContext)
  const maxTokens = params.maxTokens ?? MAX_TOKENS

  try {
    if (activeRuntime.provider === 'GEMINI') {
      // Kota (429) veya boş yanıtta sıradaki ücretsiz modele geç.
      for (const model of geminiModelCandidates(activeRuntime.model)) {
        let emittedThis = false
        try {
          for await (const chunk of callGeminiStream(
            { ...activeRuntime, model },
            systemPrompt,
            messages,
            maxTokens,
          )) {
            if (chunk) {
              emittedThis = true
              yield chunk
            }
          }
        } catch (err) {
          console.error(`[AI] Gemini stream ${model} failed:`, err instanceof Error ? err.message : err)
          // Bu modele ait parça gönderdiysek tekrar etmemek için dur.
          if (emittedThis) return
          continue // sıradaki modeli dene
        }
        if (emittedThis) return // başarılı
        // boş yanıt → sıradaki modeli dene
      }
      yield fallbackReply(siteName, messages, knowledge, params.brandName)
      return
    }

    const text = await callLlm(activeRuntime, systemPrompt, messages, maxTokens)
    yield text || fallbackReply(siteName, messages, knowledge, params.brandName)
  } catch (err) {
    console.error(`[AI] ${activeRuntime.provider} stream failed:`, err instanceof Error ? err.message : err)
    yield fallbackReply(siteName, messages, knowledge, params.brandName)
  }
}

// ─── Main entry point ───────────────────────────────────────────────

export async function generateAiReply(params: GenerateAiReplyParams): Promise<string> {
  const { siteName, messages, knowledge } = params

  if (!messages || messages.length === 0) {
    return fallbackReply(siteName, [], knowledge, params.brandName)
  }

  const runtime = resolveAiConfig(params.dbConfig, params.plan)
  if (!runtime) {
    return fallbackReply(siteName, messages, knowledge, params.brandName)
  }

  const routedModel =
    params.smartRoutingEnabled === false
      ? runtime.model
      : pickRoutedModel(runtime.provider, runtime.model, messages)
  const activeRuntime = routedModel === runtime.model ? runtime : { ...runtime, model: routedModel }

  let enrichedContext = params.visitorContext
  if (params.webSearchEnabled) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
    const web = await fetchWebContext(lastUser)
    if (web) {
      enrichedContext = [enrichedContext, `Güncel web bilgisi (doğrula, uydurma):\n${web}`]
        .filter(Boolean)
        .join('\n\n')
    }
  }

  const systemPrompt = buildSystemPrompt(siteName, knowledge, params.systemPrompt, enrichedContext)

  try {
    const maxTokens = params.maxTokens ?? MAX_TOKENS

    if (activeRuntime.provider === 'GEMINI') {
      // Kota (429) veya boş yanıtta sıradaki ücretsiz Gemini modeline geç.
      for (const model of geminiModelCandidates(activeRuntime.model)) {
        try {
          const text = (await callGemini({ ...activeRuntime, model }, systemPrompt, messages, maxTokens)).trim()
          if (text) return text
        } catch (err) {
          console.error(`[AI] Gemini ${model} call failed:`, err instanceof Error ? err.message : err)
          // sıradaki modeli dene
        }
      }
      return fallbackReply(siteName, messages, knowledge, params.brandName)
    }

    const text = await callLlm(activeRuntime, systemPrompt, messages, maxTokens)
    return text || fallbackReply(siteName, messages, knowledge, params.brandName)
  } catch (err) {
    console.error(`[AI] ${runtime.provider} call failed:`, err instanceof Error ? err.message : err)
    return fallbackReply(siteName, messages, knowledge, params.brandName)
  }
}
