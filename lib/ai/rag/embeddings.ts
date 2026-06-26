import { getPlatformGeminiKey } from '../platform-config'

const EMBED_MODEL = 'text-embedding-004'
const OPENAI_EMBED_MODEL = 'text-embedding-3-small'

function geminiKey(): string | null {
  return getPlatformGeminiKey()?.trim() || process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_AI_API_KEY?.trim() || null
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const key = geminiKey()
  if (key) {
    const vectors: number[][] = []
    for (const text of texts) {
      const vec = await embedWithGemini(key, text)
      vectors.push(vec)
    }
    return vectors
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  if (openaiKey) {
    return embedWithOpenAi(openaiKey, texts)
  }

  throw new Error('Embedding için GEMINI_API_KEY veya OPENAI_API_KEY gerekli')
}

async function embedWithGemini(key: string, text: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${encodeURIComponent(key)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text: text.slice(0, 8000) }] },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini embed: ${res.status} ${err.slice(0, 200)}`)
  }

  const data = (await res.json()) as { embedding?: { values?: number[] } }
  const values = data.embedding?.values
  if (!values?.length) throw new Error('Gemini embed: boş vektör')
  return values
}

async function embedWithOpenAi(key: string, texts: string[]): Promise<number[][]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_EMBED_MODEL,
      input: texts.map((t) => t.slice(0, 8000)),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI embed: ${res.status} ${err.slice(0, 200)}`)
  }

  const data = (await res.json()) as { data?: Array<{ embedding: number[] }> }
  return (data.data ?? []).map((d) => d.embedding)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}
