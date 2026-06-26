import { generateAiReply, type ChatMessage, type DbAiConfig } from './provider'
import type { PlanType } from '@/lib/constants'

export type CopilotMode =
  | 'suggest'
  | 'professional'
  | 'friendly'
  | 'shorten'
  | 'expand'
  | 'grammar'
  | 'translate_tr'

const MODE_PROMPTS: Record<Exclude<CopilotMode, 'suggest'>, string> = {
  professional:
    'Metni profesyonel, net ve kurumsal bir tonda yeniden yaz. Anlamı koru, gereksiz söz ekleme.',
  friendly: 'Metni sıcak, samimi ve yardımsever bir tonda yeniden yaz. Anlamı koru.',
  shorten: 'Metni daha kısa ve öz hale getir; gereksiz tekrarları çıkar.',
  expand: 'Metni biraz genişlet; eksik detayları mantıklı şekilde tamamla ama abartma.',
  grammar: 'Yazım ve dilbilgisi hatalarını düzelt; anlamı değiştirme.',
  translate_tr: 'Metni doğal Türkçeye çevir veya Türkçe akıcılığını düzelt.',
}

export interface CopilotParams {
  siteName: string
  messages: ChatMessage[]
  draft?: string
  mode: CopilotMode
  systemPrompt?: string
  knowledge?: import('./provider').KnowledgeEntry[]
  dbConfig?: DbAiConfig | null
  plan?: PlanType
}

export async function runCopilot(params: CopilotParams): Promise<string> {
  const { mode, messages, draft, siteName } = params

  if (mode === 'suggest') {
    return generateAiReply({
      siteName,
      messages,
      knowledge: params.knowledge,
      systemPrompt: params.systemPrompt,
      dbConfig: params.dbConfig,
      plan: params.plan,
      maxTokens: 512,
    })
  }

  const base = draft?.trim() || messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || ''
  if (!base) {
    return generateAiReply({
      siteName,
      messages,
      systemPrompt: params.systemPrompt,
      dbConfig: params.dbConfig,
      plan: params.plan,
      maxTokens: 512,
    })
  }

  const instruction = MODE_PROMPTS[mode]
  return generateAiReply({
    siteName,
    messages: [{ role: 'user', content: `${instruction}\n\nMetin:\n${base}` }],
    systemPrompt:
      'Sen müşteri destek metin editörüsün. Sadece düzenlenmiş metni döndür; açıklama ekleme.',
    dbConfig: params.dbConfig,
    plan: params.plan,
    maxTokens: 640,
  })
}
