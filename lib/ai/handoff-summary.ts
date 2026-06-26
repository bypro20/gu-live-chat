import { generateAiReply, type DbAiConfig } from './provider'
import { toChatMessages } from './knowledge-legacy'
import { updateConversationHandoffSummary } from './rag/db'
import { prisma } from '@/lib/db'
import type { PlanType } from '@/lib/constants'

export async function generateHandoffSummary(params: {
  conversationId: string
  siteName: string
  dbConfig?: DbAiConfig | null
  plan?: PlanType
}): Promise<string | null> {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: params.conversationId },
      orderBy: { createdAt: 'asc' },
      take: 24,
      select: { content: true, senderType: true },
    })

    if (messages.length === 0) return null

    const chat = toChatMessages(messages)
    const summary = await generateAiReply({
      siteName: params.siteName,
      messages: chat,
      systemPrompt:
        'Konuşmayı temsilci için 3-5 maddelik Türkçe özet çıkar: ziyaretçi kimliği, talep, önemli detaylar, beklenen aksiyon. Kısa ve net yaz.',
      dbConfig: params.dbConfig,
      plan: params.plan,
      maxTokens: 320,
    })

    const trimmed = summary?.trim()
    if (!trimmed) return null

    await updateConversationHandoffSummary(params.conversationId, trimmed)
    return trimmed
  } catch (err) {
    console.error('[handoff-summary]', err instanceof Error ? err.message : err)
    return null
  }
}
