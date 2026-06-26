import { prisma } from '@/lib/db'
import { randomUUID } from 'crypto'

export type RagSourceRow = {
  id: string
  websiteId: string
  type: string
  name: string
  url: string | null
  textContent: string | null
  fileName: string | null
  status: string
  errorMessage: string | null
  chunkCount: number
  lastIndexedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export async function listKnowledgeSources(websiteId: string): Promise<RagSourceRow[]> {
  return prisma.$queryRawUnsafe<RagSourceRow[]>(
    `SELECT * FROM "knowledge_sources" WHERE "websiteId" = ? ORDER BY "createdAt" DESC`,
    websiteId
  )
}

export async function getKnowledgeSource(id: string): Promise<RagSourceRow | null> {
  const rows = await prisma.$queryRawUnsafe<RagSourceRow[]>(
    `SELECT * FROM "knowledge_sources" WHERE "id" = ? LIMIT 1`,
    id
  )
  return rows[0] ?? null
}

export async function createKnowledgeSourceRow(input: {
  websiteId: string
  type: string
  name: string
  url?: string
  textContent?: string
  fileName?: string
}): Promise<string> {
  const id = randomUUID()
  const now = new Date().toISOString()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "knowledge_sources"
      ("id", "websiteId", "type", "name", "url", "textContent", "fileName", "status", "chunkCount", "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?, ?)`,
    id,
    input.websiteId,
    input.type,
    input.name,
    input.url ?? null,
    input.textContent ?? null,
    input.fileName ?? null,
    now,
    now
  )
  return id
}

export async function updateKnowledgeSourceRow(
  id: string,
  patch: Partial<{
    status: string
    chunkCount: number
    errorMessage: string | null
    lastIndexedAt: Date | null
  }>
): Promise<void> {
  const sets: string[] = []
  const values: unknown[] = []

  if (patch.status !== undefined) {
    sets.push('"status" = ?')
    values.push(patch.status)
  }
  if (patch.chunkCount !== undefined) {
    sets.push('"chunkCount" = ?')
    values.push(patch.chunkCount)
  }
  if (patch.errorMessage !== undefined) {
    sets.push('"errorMessage" = ?')
    values.push(patch.errorMessage)
  }
  if (patch.lastIndexedAt !== undefined) {
    sets.push('"lastIndexedAt" = ?')
    values.push(patch.lastIndexedAt ? patch.lastIndexedAt.toISOString() : null)
  }

  sets.push('"updatedAt" = ?')
  values.push(new Date().toISOString())
  values.push(id)

  await prisma.$executeRawUnsafe(
    `UPDATE "knowledge_sources" SET ${sets.join(', ')} WHERE "id" = ?`,
    ...values
  )
}

export async function deleteKnowledgeSourceRow(id: string): Promise<void> {
  await prisma.$executeRawUnsafe(`DELETE FROM "knowledge_chunks" WHERE "sourceId" = ?`, id)
  await prisma.$executeRawUnsafe(`DELETE FROM "knowledge_sources" WHERE "id" = ?`, id)
}

export async function deleteChunksForSource(sourceId: string): Promise<void> {
  await prisma.$executeRawUnsafe(`DELETE FROM "knowledge_chunks" WHERE "sourceId" = ?`, sourceId)
}

export async function deleteChunksForArticle(websiteId: string, articleId: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `DELETE FROM "knowledge_chunks" WHERE "websiteId" = ? AND "articleId" = ?`,
    websiteId,
    articleId
  )
}

export async function countKnowledgeChunks(websiteId: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ n: number }>>(
    `SELECT COUNT(*) as n FROM "knowledge_chunks" WHERE "websiteId" = ?`,
    websiteId
  )
  return Number(rows[0]?.n ?? 0)
}

export async function countArticleChunks(websiteId: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ n: number }>>(
    `SELECT COUNT(*) as n FROM "knowledge_chunks" WHERE "websiteId" = ? AND "articleId" IS NOT NULL`,
    websiteId
  )
  return Number(rows[0]?.n ?? 0)
}

export async function listKnowledgeChunks(
  websiteId: string,
  limit: number
): Promise<Array<{ title: string; content: string; embedding: string }>> {
  return prisma.$queryRawUnsafe(
    `SELECT "title", "content", "embedding" FROM "knowledge_chunks"
     WHERE "websiteId" = ? ORDER BY "createdAt" DESC LIMIT ?`,
    websiteId,
    limit
  )
}

export async function insertKnowledgeChunk(input: {
  websiteId: string
  sourceId: string | null
  articleId: string | null
  title: string
  content: string
  embedding: string
  tokenEstimate: number
}): Promise<void> {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "knowledge_chunks"
      ("id", "websiteId", "sourceId", "articleId", "title", "content", "embedding", "tokenEstimate", "createdAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    randomUUID(),
    input.websiteId,
    input.sourceId,
    input.articleId,
    input.title,
    input.content,
    input.embedding,
    input.tokenEstimate,
    new Date().toISOString()
  )
}

export async function updateConversationHandoffSummary(
  conversationId: string,
  summary: string
): Promise<void> {
  await prisma.$executeRawUnsafe(
    `UPDATE "conversations" SET "aiHandoffSummary" = ?, "updatedAt" = ? WHERE "id" = ?`,
    summary,
    new Date().toISOString(),
    conversationId
  )
}
