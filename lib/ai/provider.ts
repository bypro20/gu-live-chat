import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { DEFAULT_MODEL } from './models'

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
}

export interface GenerateAiReplyParams {
  siteName: string
  messages: ChatMessage[]
  knowledge?: KnowledgeEntry[]
  systemPrompt?: string
  dbConfig?: DbAiConfig | null
  websiteId?: string
  conversationId?: string
  visitorContext?: string
}

const MAX_TOKENS = 1024

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

export function getEnvProviderStatus() {
  return {
    openai: !!ENV_KEYS.OPENAI?.trim(),
    anthropic: !!ENV_KEYS.ANTHROPIC?.trim(),
    gemini: !!ENV_KEYS.GEMINI?.trim(),
    groq: !!ENV_KEYS.GROQ?.trim(),
    openrouter: !!ENV_KEYS.OPENROUTER?.trim(),
    ollama: !!ollamaBaseUrl(),
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

export function hasAnyPlatformAiKey(): boolean {
  return pickDefaultProvider() !== null
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
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://guchat.org',
      'X-Title': 'Gu Chat',
    }
  }

  return cfg
}

export function resolveAiConfig(db?: DbAiConfig | null): AiRuntimeConfig | null {
  const temperature = db?.temperature ?? 0.75
  const preferred = db?.provider

  if (preferred) {
    const cfg = runtimeForProvider(preferred, db, temperature)
    if (cfg) return cfg
  }

  for (const provider of ['GEMINI', 'OPENROUTER', 'GROQ', 'OPENAI', 'ANTHROPIC', 'OLLAMA'] as AiProvider[]) {
    const cfg = runtimeForProvider(provider, db, temperature)
    if (cfg) return cfg
  }

  if (db?.apiKey?.trim()) {
    const provider = db.provider
    return {
      provider,
      apiKey: db.apiKey.trim(),
      model: db.model || DEFAULT_MODEL[provider],
      temperature,
      source: 'db',
    }
  }

  return null
}

export function isAiLlmAvailable(db?: DbAiConfig | null): boolean {
  return resolveAiConfig(db) !== null
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

export function fallbackReply(siteName: string, messages: ChatMessage[], knowledge?: KnowledgeEntry[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content?.trim() || ''

  if (!lastUser) {
    return `Merhaba! ${siteName} destek ekibine hoş geldiniz. Size nasıl yardımcı olabilirim?`
  }

  if (GREETING_RE.test(lastUser) && lastUser.length < 40) {
    return `Merhaba, hoş geldiniz! ${siteName} olarak buradayız — size nasıl yardımcı olabilirim?`
  }

  if (THANKS_RE.test(lastUser) && lastUser.length < 40) {
    return `Rica ederim! Başka bir sorunuz olursa buradayım.`
  }

  if (knowledge && knowledge.length > 0) {
    const queryTokens = new Set(tokenize(lastUser))
    if (queryTokens.size > 0) {
      let best: { entry: KnowledgeEntry; score: number } | null = null
      for (const entry of knowledge) {
        const entryTokens = tokenize(`${entry.title} ${entry.content}`)
        let score = 0
        for (const t of entryTokens) if (queryTokens.has(t)) score++
        if (!best || score > best.score) best = { entry, score }
      }
      if (best && best.score >= 2) {
        return `${best.entry.title} hakkında: ${truncate(best.entry.content, 450)}\n\nBaşka sorunuz varsa yazabilirsiniz.`
      }
    }
  }

  return `Mesajınızı aldım. Kısa süre içinde size dönüş yapacağız — bu arada başka bir konuda yardımcı olmamı ister misiniz?`
}

// ─── Provider calls ─────────────────────────────────────────────────

async function callOpenAiCompat(runtime: AiRuntimeConfig, systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const client = new OpenAI({
    apiKey: runtime.apiKey,
    baseURL: runtime.baseURL,
    defaultHeaders: runtime.extraHeaders,
  })
  const completion = await client.chat.completions.create({
    model: runtime.model,
    temperature: runtime.temperature,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  })
  return completion.choices[0]?.message?.content?.trim() || ''
}

async function callAnthropic(runtime: AiRuntimeConfig, systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const client = new Anthropic({ apiKey: runtime.apiKey })
  const resp = await client.messages.create({
    model: runtime.model,
    max_tokens: MAX_TOKENS,
    temperature: runtime.temperature,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })
  const textBlock = resp.content.find((b) => b.type === 'text')
  return textBlock && 'text' in textBlock ? textBlock.text.trim() : ''
}

async function callGemini(runtime: AiRuntimeConfig, systemPrompt: string, messages: ChatMessage[]): Promise<string> {
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
        maxOutputTokens: MAX_TOKENS,
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

async function callLlm(runtime: AiRuntimeConfig, systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  switch (runtime.provider) {
    case 'ANTHROPIC':
      return callAnthropic(runtime, systemPrompt, messages)
    case 'GEMINI':
      return callGemini(runtime, systemPrompt, messages)
    case 'OPENAI':
    case 'GROQ':
    case 'OPENROUTER':
    case 'OLLAMA':
      return callOpenAiCompat(runtime, systemPrompt, messages)
    default:
      return ''
  }
}

// ─── Main entry point ───────────────────────────────────────────────

export async function generateAiReply(params: GenerateAiReplyParams): Promise<string> {
  const { siteName, messages, knowledge } = params

  if (!messages || messages.length === 0) {
    return fallbackReply(siteName, [], knowledge)
  }

  const runtime = resolveAiConfig(params.dbConfig)
  if (!runtime) {
    return fallbackReply(siteName, messages, knowledge)
  }

  const systemPrompt = buildSystemPrompt(siteName, knowledge, params.systemPrompt, params.visitorContext)

  try {
    const text = await callLlm(runtime, systemPrompt, messages)
    return text || fallbackReply(siteName, messages, knowledge)
  } catch (err) {
    console.error(`[AI] ${runtime.provider} call failed:`, err instanceof Error ? err.message : err)
    return fallbackReply(siteName, messages, knowledge)
  }
}
