import {
  generateAiReply,
  hasAnyPlatformAiKey,
  isAiLlmAvailable,
  type ChatMessage,
} from '@/lib/ai/provider'

const MARKETING_MAX_CHARS = 12000

function stripJsonFence(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i)
  if (fenced?.[1]) return fenced[1].trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1)
  return trimmed
}

export function parseAiJson<T>(raw: string): T | null {
  try {
    return JSON.parse(stripJsonFence(raw)) as T
  } catch {
    return null
  }
}

export function isOrganicAiAvailable(): boolean {
  return hasAnyPlatformAiKey() && isAiLlmAvailable(null)
}

export async function askMarketingAi(systemPrompt: string, userPrompt: string): Promise<string> {
  const messages: ChatMessage[] = [{ role: 'user', content: userPrompt.slice(0, MARKETING_MAX_CHARS) }]

  const reply = await generateAiReply({
    siteName: 'Gu Live Chat Pazarlama',
    messages,
    systemPrompt:
      systemPrompt +
      '\n\nYanıtın SADECE geçerli JSON olsun. Markdown, açıklama veya code fence kullanma.',
    plan: 'PRO',
    dbConfig: { provider: 'GEMINI', model: 'gemini-2.5-flash', apiKey: null, temperature: 0.4 },
  })

  return reply.trim()
}
