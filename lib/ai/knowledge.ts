import { selectRelevantKnowledge } from './knowledge-legacy'
import { searchRagKnowledge } from './rag/search'
import type { KnowledgeEntry } from './provider'

export { selectRelevantKnowledge, loadKnowledge, toChatMessages } from './knowledge-legacy'

/** Load knowledge entries relevant to a query — RAG first, keyword fallback. */
export async function loadRelevantKnowledge(
  websiteDbId: string,
  query: string,
  limit = 12
): Promise<KnowledgeEntry[]> {
  const rag = await searchRagKnowledge(websiteDbId, query, limit)
  if (rag.length > 0) return rag

  const { loadKnowledge } = await import('./knowledge-legacy')
  const articles = await loadKnowledge(websiteDbId)
  return selectRelevantKnowledge(query, articles, limit)
}

