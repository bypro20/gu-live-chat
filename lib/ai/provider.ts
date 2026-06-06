import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// ─── Types ──────────────────────────────────────────────────────────

export type AiProvider = 'OPENAI' | 'ANTHROPIC'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface KnowledgeEntry {
  title: string
  content: string
}

/** Per-website config stored in the DB (AIConfig). Used as a fallback when
 * no environment API key is present. */
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
  /** Where the API key came from — env always wins over the DB. */
  source: 'env' | 'db'
}

export interface GenerateAiReplyParams {
  /** Display name of the website, used in the system prompt. */
  siteName: string
  /** Conversation history, oldest → newest. */
  messages: ChatMessage[]
  /** Optional knowledge base / FAQ entries to ground the answer. */
  knowledge?: KnowledgeEntry[]
  /** Optional custom system prompt that overrides the default. */
  systemPrompt?: string
  /** Optional per-website DB config (used only when env keys are absent). */
  dbConfig?: DbAiConfig | null
  /** Optional identifiers for logging/diagnostics only. */
  websiteId?: string
  conversationId?: string
}

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-haiku-latest'
const MAX_TOKENS = 500

// ─── Env / provider discovery ───────────────────────────────────────

/** Returns which providers have an API key defined in the environment.
 * Never exposes the key value itself. */
export function getEnvProviderStatus(): { openai: boolean; anthropic: boolean } {
  return {
    openai: !!process.env.OPENAI_API_KEY?.trim(),
    anthropic: !!process.env.ANTHROPIC_API_KEY?.trim(),
  }
}

/** Resolves the effective runtime config. Environment keys always take
 * precedence over DB-stored keys. Returns null when no key is available
 * anywhere (caller should then use the rule/knowledge fallback). */
export function resolveAiConfig(db?: DbAiConfig | null): AiRuntimeConfig | null {
  const envOpenai = process.env.OPENAI_API_KEY?.trim()
  const envAnthropic = process.env.ANTHROPIC_API_KEY?.trim()
  const temperature = db?.temperature ?? 0.7
  const preferred = db?.provider

  // Honour the admin's preferred provider when its env key exists.
  if (preferred === 'ANTHROPIC' && envAnthropic) {
    return { provider: 'ANTHROPIC', apiKey: envAnthropic, model: db?.model || DEFAULT_ANTHROPIC_MODEL, temperature, source: 'env' }
  }
  if (preferred === 'OPENAI' && envOpenai) {
    return { provider: 'OPENAI', apiKey: envOpenai, model: db?.model || DEFAULT_OPENAI_MODEL, temperature, source: 'env' }
  }
  // Otherwise use whichever env key is present.
  if (envOpenai) {
    return { provider: 'OPENAI', apiKey: envOpenai, model: db?.model || DEFAULT_OPENAI_MODEL, temperature, source: 'env' }
  }
  if (envAnthropic) {
    return { provider: 'ANTHROPIC', apiKey: envAnthropic, model: db?.model || DEFAULT_ANTHROPIC_MODEL, temperature, source: 'env' }
  }
  // Finally fall back to a per-website key saved in the DB.
  if (db?.apiKey && db.apiKey.trim()) {
    const model = db.model || (db.provider === 'ANTHROPIC' ? DEFAULT_ANTHROPIC_MODEL : DEFAULT_OPENAI_MODEL)
    return { provider: db.provider, apiKey: db.apiKey.trim(), model, temperature, source: 'db' }
  }
  return null
}

/** True when a real LLM can be reached (env or DB key present). */
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
    .slice(0, 12)
    .map((k, i) => `${i + 1}. ${k.title}\n${truncate(k.content, 600)}`)
    .join('\n\n')
}

function buildSystemPrompt(siteName: string, knowledge?: KnowledgeEntry[], custom?: string): string {
  const base =
    custom?.trim() ||
    `Sen ${siteName} için çalışan yardımcı, kibar ve profesyonel bir müşteri destek asistanısın. ` +
      `Ziyaretçilere her zaman Türkçe, kısa ve net yanıt ver. Samimi ama profesyonel bir dil kullan. ` +
      `Emin olmadığın ya da bilgi tabanında bulunmayan konularda bilgi uydurma; konuyu bir insan ` +
      `müşteri temsilcisine aktarabileceğini nazikçe belirt.`

  const kb = knowledgeToText(knowledge)
  if (kb) {
    return `${base}\n\nAşağıda ${siteName} hakkında bilgi tabanı/SSS içeriği yer alıyor. ` +
      `Soru bu içerikle ilgiliyse yanıtını buradaki bilgilere dayandır:\n\n${kb}`
  }
  return base
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

/** Produces a sensible Turkish reply with no LLM. Matches the visitor's
 * message against the knowledge base, with graceful greetings/thanks
 * handling and a polite default. Never throws. */
export function fallbackReply(siteName: string, messages: ChatMessage[], knowledge?: KnowledgeEntry[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content?.trim() || ''

  if (!lastUser) {
    return `Merhaba! Ben ${siteName} yapay zekâ destek asistanıyım. Size nasıl yardımcı olabilirim?`
  }

  if (GREETING_RE.test(lastUser) && lastUser.length < 40) {
    return `Merhaba! Ben ${siteName} destek asistanıyım. Size nasıl yardımcı olabilirim?`
  }

  if (THANKS_RE.test(lastUser) && lastUser.length < 40) {
    return `Rica ederim! Başka bir konuda yardımcı olabileceğim bir şey varsa buradayım. 🙂`
  }

  // Try to match the question against knowledge base entries.
  if (knowledge && knowledge.length > 0) {
    const queryTokens = new Set(tokenize(lastUser))
    if (queryTokens.size > 0) {
      let best: { entry: KnowledgeEntry; score: number } | null = null
      for (const entry of knowledge) {
        const entryTokens = tokenize(`${entry.title} ${entry.title} ${entry.content}`)
        let score = 0
        for (const t of entryTokens) if (queryTokens.has(t)) score++
        if (!best || score > best.score) best = { entry, score }
      }
      if (best && best.score >= 1) {
        return `"${best.entry.title}" ile ilgili şu bilgi yardımcı olabilir:\n\n${truncate(best.entry.content, 500)}\n\nBaşka bir sorunuz olursa bir müşteri temsilcimiz de en kısa sürede size yardımcı olacaktır.`
      }
    }
  }

  return (
    `Mesajınız için teşekkürler! Sorunuzu not aldım ve en kısa sürede bir müşteri ` +
    `temsilcimiz size dönüş yapacaktır. Bu sırada yardımcı olabileceğim başka bir konu var mı?`
  )
}

// ─── Main entry point ───────────────────────────────────────────────

/**
 * Generates an assistant reply in Turkish. Uses a real LLM (OpenAI or
 * Anthropic) when an API key is available via env or the per-website DB
 * config; otherwise it falls back to a rule/knowledge-based response.
 * This function never throws — on any error it degrades to the fallback.
 */
export async function generateAiReply(params: GenerateAiReplyParams): Promise<string> {
  const { siteName, messages, knowledge } = params

  if (!messages || messages.length === 0) {
    return fallbackReply(siteName, [], knowledge)
  }

  const runtime = resolveAiConfig(params.dbConfig)
  if (!runtime) {
    return fallbackReply(siteName, messages, knowledge)
  }

  const systemPrompt = buildSystemPrompt(siteName, knowledge, params.systemPrompt)

  try {
    if (runtime.provider === 'OPENAI') {
      const client = new OpenAI({ apiKey: runtime.apiKey })
      const completion = await client.chat.completions.create({
        model: runtime.model,
        temperature: runtime.temperature,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      })
      const text = completion.choices[0]?.message?.content?.trim()
      return text || fallbackReply(siteName, messages, knowledge)
    }

    // ANTHROPIC
    const client = new Anthropic({ apiKey: runtime.apiKey })
    const resp = await client.messages.create({
      model: runtime.model,
      max_tokens: MAX_TOKENS,
      temperature: runtime.temperature,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })
    const textBlock = resp.content.find((b) => b.type === 'text')
    const text = textBlock && 'text' in textBlock ? textBlock.text.trim() : ''
    return text || fallbackReply(siteName, messages, knowledge)
  } catch (err) {
    // Never surface provider errors to the chat flow — degrade gracefully.
    console.error('[AI] LLM call failed, using fallback reply.')
    return fallbackReply(siteName, messages, knowledge)
  }
}
