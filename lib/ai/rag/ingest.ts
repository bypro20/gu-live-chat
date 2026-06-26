import {
  countKnowledgeChunks,
  createKnowledgeSourceRow,
  deleteChunksForArticle,
  deleteChunksForSource,
  getKnowledgeSource,
  insertKnowledgeChunk,
  listKnowledgeChunks,
  updateKnowledgeSourceRow,
} from './db'
import { splitTextIntoChunks, htmlToPlainText } from './chunk'
import { embedTexts } from './embeddings'
import { prisma } from '@/lib/db'

type KnowledgeSourceType = 'URL' | 'FILE' | 'TEXT' | 'ARTICLE'
type KnowledgeSourceStatus = 'PENDING' | 'INDEXING' | 'READY' | 'ERROR'

const FETCH_TIMEOUT_MS = 12_000

async function setSourceStatus(
  sourceId: string,
  status: KnowledgeSourceStatus,
  patch: { chunkCount?: number; errorMessage?: string | null; lastIndexedAt?: Date } = {}
) {
  await updateKnowledgeSourceRow(sourceId, {
    status,
    chunkCount: patch.chunkCount,
    errorMessage: patch.errorMessage,
    lastIndexedAt: patch.lastIndexedAt ?? null,
  })
}

async function storeChunks(
  websiteId: string,
  sourceId: string | null,
  articleId: string | null,
  title: string,
  text: string
): Promise<number> {
  const pieces = splitTextIntoChunks(title, text)
  if (pieces.length === 0) return 0

  if (sourceId) await deleteChunksForSource(sourceId)
  if (articleId) await deleteChunksForArticle(websiteId, articleId)

  const vectors = await embedTexts(pieces.map((p) => `${p.title}\n${p.content}`))

  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i]
    await insertKnowledgeChunk({
      websiteId,
      sourceId,
      articleId,
      title: piece.title,
      content: piece.content,
      embedding: JSON.stringify(vectors[i] ?? []),
      tokenEstimate: Math.ceil(piece.content.length / 4),
    })
  }

  return pieces.length
}

export async function fetchUrlText(url: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'GuLiveChat-RAG/1.0' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    const text = htmlToPlainText(html)
    if (text.length < 40) throw new Error('Sayfadan yeterli metin çıkarılamadı')
    return text.slice(0, 120_000)
  } finally {
    clearTimeout(timer)
  }
}

export async function indexKnowledgeSource(sourceId: string): Promise<{ chunkCount: number }> {
  const source = await getKnowledgeSource(sourceId)
  if (!source) throw new Error('Kaynak bulunamadı')

  await setSourceStatus(sourceId, 'INDEXING', { errorMessage: null })

  try {
    let text = ''
    if (source.type === 'URL') {
      if (!source.url?.trim()) throw new Error('URL boş')
      text = await fetchUrlText(source.url.trim())
    } else if (source.type === 'TEXT' || source.type === 'FILE') {
      text = source.textContent?.trim() || ''
      if (!text) throw new Error('Metin içeriği boş')
    } else {
      throw new Error('Desteklenmeyen kaynak tipi')
    }

    const chunkCount = await storeChunks(source.websiteId, sourceId, null, source.name, text)
    await setSourceStatus(sourceId, 'READY', {
      chunkCount,
      lastIndexedAt: new Date(),
      errorMessage: null,
    })
    return { chunkCount }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'İndeksleme hatası'
    await setSourceStatus(sourceId, 'ERROR', { errorMessage: msg, chunkCount: 0 })
    throw err
  }
}

export async function indexKnowledgeArticle(websiteId: string, articleId: string): Promise<number> {
  const article = await prisma.knowledgeArticle.findFirst({
    where: { id: articleId, websiteId, status: 'PUBLISHED' },
    select: { id: true, title: true, content: true, excerpt: true },
  })
  if (!article) {
    await deleteChunksForArticle(websiteId, articleId)
    return 0
  }

  const body = [article.title, article.excerpt?.trim(), article.content].filter(Boolean).join('\n\n')
  return storeChunks(websiteId, null, articleId, article.title, body)
}

export async function reindexAllArticles(websiteId: string): Promise<{ articles: number; chunks: number }> {
  const articles = await prisma.knowledgeArticle.findMany({
    where: { websiteId, status: 'PUBLISHED' },
    select: { id: true },
  })

  let chunks = 0
  for (const a of articles) {
    chunks += await indexKnowledgeArticle(websiteId, a.id)
  }
  return { articles: articles.length, chunks }
}

export async function createKnowledgeSource(input: {
  websiteId: string
  type: KnowledgeSourceType
  name: string
  url?: string
  textContent?: string
  fileName?: string
}): Promise<{ id: string; chunkCount: number }> {
  const id = await createKnowledgeSourceRow(input)
  const { chunkCount } = await indexKnowledgeSource(id)
  return { id, chunkCount }
}
