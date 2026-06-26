import type { KnowledgeEntry } from '../provider'
import { cosineSimilarity, embedTexts } from './embeddings'
import { countKnowledgeChunks, listKnowledgeChunks } from './db'

const DEFAULT_LIMIT = 8
const MIN_SCORE = 0.42

function parseEmbedding(raw: string): number[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed.filter((n) => typeof n === 'number') as number[]
  } catch {
    return null
  }
}

/** Semantic search over indexed knowledge chunks. Falls back to empty on error. */
export async function searchRagKnowledge(
  websiteDbId: string,
  query: string,
  limit = DEFAULT_LIMIT
): Promise<KnowledgeEntry[]> {
  const q = query.trim()
  if (!q) return []

  try {
    const count = await countKnowledgeChunks(websiteDbId)
    if (count === 0) return []

    const [queryVec] = await embedTexts([q])
    if (!queryVec?.length) return []

    const chunks = await listKnowledgeChunks(websiteDbId, Math.min(count, 400))

    const scored = chunks
      .map((c) => {
        const vec = parseEmbedding(c.embedding)
        if (!vec) return null
        return { entry: { title: c.title, content: c.content }, score: cosineSimilarity(queryVec, vec) }
      })
      .filter((s): s is { entry: KnowledgeEntry; score: number } => s !== null)
      .sort((a, b) => b.score - a.score)

    const top = scored.filter((s) => s.score >= MIN_SCORE).slice(0, limit)
    if (top.length > 0) return top.map((s) => s.entry)

    return scored.slice(0, limit).map((s) => s.entry)
  } catch (err) {
    console.error('[RAG search]', err instanceof Error ? err.message : err)
    return []
  }
}

export async function websiteHasRagIndex(websiteDbId: string): Promise<boolean> {
  try {
    const n = await countKnowledgeChunks(websiteDbId)
    return n > 0
  } catch {
    return false
  }
}
