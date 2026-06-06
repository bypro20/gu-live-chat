import { prisma } from '../db'
import type { ChatMessage, KnowledgeEntry } from './provider'

/** Loads published knowledge base / FAQ articles for a website to ground
 * AI answers. Returns an empty list on any error (never throws). */
export async function loadKnowledge(websiteDbId: string): Promise<KnowledgeEntry[]> {
  try {
    const articles = await prisma.knowledgeArticle.findMany({
      where: { websiteId: websiteDbId, status: 'PUBLISHED' },
      select: { title: true, content: true, excerpt: true },
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
      take: 20,
    })
    return articles.map((a) => ({
      title: a.title,
      content: a.excerpt?.trim() || a.content,
    }))
  } catch {
    return []
  }
}

interface RawMessage {
  content: string
  senderType: string
}

/** Maps stored conversation messages (oldest → newest) into the role-based
 * format the LLM expects. Visitor messages become "user", everything else
 * (agent/bot) becomes "assistant". System messages are dropped. */
export function toChatMessages(messages: RawMessage[]): ChatMessage[] {
  return messages
    .filter((m) => m.senderType === 'VISITOR' || m.senderType === 'AGENT' || m.senderType === 'BOT')
    .map((m) => ({
      role: m.senderType === 'VISITOR' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    }))
}
