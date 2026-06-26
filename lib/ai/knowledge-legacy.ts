import { prisma } from '../db'
import type { ChatMessage, KnowledgeEntry } from './provider'

const STOP_WORDS = new Set([
  'bir', 'bu', 've', 'ile', 'için', 'mı', 'mi', 'mu', 'mü', 'the', 'and', 'for', 'how',
  'ne', 'nasıl', 'nedir', 'var', 'yok', 'gibi', 'daha', 'en', 'çok',
])

function tokenize(text: string): string[] {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
}

/** Loads published knowledge base / FAQ articles for a website to ground
 * AI answers. Returns an empty list on any error (never throws). */
export async function loadKnowledge(websiteDbId: string): Promise<KnowledgeEntry[]> {
  try {
    const articles = await prisma.knowledgeArticle.findMany({
      where: { websiteId: websiteDbId, status: 'PUBLISHED' },
      select: { title: true, content: true, excerpt: true },
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }, { updatedAt: 'desc' }],
      take: 48,
    })
    return articles.map((a) => ({
      title: a.title,
      content: a.excerpt?.trim() || a.content,
    }))
  } catch {
    return []
  }
}

/** Pick articles most relevant to the visitor question for LLM context. */
export function selectRelevantKnowledge(
  query: string,
  knowledge: KnowledgeEntry[],
  limit = 12
): KnowledgeEntry[] {
  if (!knowledge.length) return []
  if (!query.trim()) return knowledge.slice(0, limit)

  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return knowledge.slice(0, limit)

  const scored = knowledge.map((entry) => {
    const titleTokens = new Set(tokenize(entry.title))
    const bodyTokens = tokenize(entry.content)
    let score = 0
    for (const t of queryTokens) {
      if (titleTokens.has(t)) score += 4
      if (entry.title.toLocaleLowerCase('tr-TR').includes(t)) score += 3
      if (bodyTokens.includes(t)) score += 1
    }
    return { entry, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const top = scored.filter((s) => s.score > 0).slice(0, limit)
  if (top.length > 0) return top.map((s) => s.entry)
  return knowledge.slice(0, limit)
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
