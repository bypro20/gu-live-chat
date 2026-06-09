import type { KnowledgeEntry } from './provider'

const STOP_WORDS = new Set([
  'bir', 'bu', 've', 'ile', 'için', 'mı', 'mi', 'mu', 'mü', 'the', 'and', 'for', 'how',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
}

/**
 * Bilgi bankasından hızlı SSS eşleşmesi — LLM çağrısından önce standart talepleri çözer.
 */
export function matchFaqFromKnowledge(
  visitorMessage: string,
  knowledge: KnowledgeEntry[]
): { answer: string; title: string; confidence: number } | null {
  if (!visitorMessage.trim() || knowledge.length === 0) return null

  const queryTokens = tokenize(visitorMessage)
  if (queryTokens.length === 0) return null

  let best: { answer: string; title: string; score: number; max: number } | null = null

  for (const article of knowledge) {
    const titleTokens = tokenize(article.title)
    const bodyTokens = tokenize(article.content)
    const allTokens = new Set([...titleTokens, ...bodyTokens])

    let score = 0
    for (const t of queryTokens) {
      if (allTokens.has(t)) score++
      if (article.title.toLowerCase().includes(t)) score += 2
    }

    const max = Math.max(queryTokens.length + 2, 1)
    if (score >= 2 && (!best || score > best.score)) {
      best = {
        answer: article.content.trim().slice(0, 1200),
        title: article.title,
        score,
        max,
      }
    }
  }

  if (!best) return null

  const confidence = Math.min(1, best.score / best.max)
  if (confidence < 0.35) return null

  return {
    answer: best.answer,
    title: best.title,
    confidence,
  }
}
