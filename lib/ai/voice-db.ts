import { prisma } from '@/lib/db'
import { randomUUID } from 'crypto'

export type VoiceAgentRow = {
  id: string
  websiteId: string
  isActive: boolean
  name: string
  greeting: string
  systemPrompt: string | null
  language: string
  voiceStyle: string
}

export async function getVoiceAgent(websiteDbId: string): Promise<VoiceAgentRow | null> {
  const rows = await prisma.$queryRawUnsafe<VoiceAgentRow[]>(
    `SELECT * FROM "voice_agents" WHERE "websiteId" = ? LIMIT 1`,
    websiteDbId
  )
  const row = rows[0]
  if (!row) return null
  return { ...row, isActive: !!row.isActive }
}

export async function upsertVoiceAgent(
  websiteDbId: string,
  input: Partial<Omit<VoiceAgentRow, 'id' | 'websiteId'>>
): Promise<VoiceAgentRow> {
  const existing = await getVoiceAgent(websiteDbId)
  const now = new Date().toISOString()

  if (existing) {
    await prisma.$executeRawUnsafe(
      `UPDATE "voice_agents" SET
        "isActive" = ?,
        "name" = ?,
        "greeting" = ?,
        "systemPrompt" = ?,
        "language" = ?,
        "voiceStyle" = ?,
        "updatedAt" = ?
       WHERE "websiteId" = ?`,
      input.isActive !== undefined ? (input.isActive ? 1 : 0) : existing.isActive ? 1 : 0,
      input.name ?? existing.name,
      input.greeting ?? existing.greeting,
      input.systemPrompt ?? existing.systemPrompt,
      input.language ?? existing.language,
      input.voiceStyle ?? existing.voiceStyle,
      now,
      websiteDbId
    )
    return (await getVoiceAgent(websiteDbId))!
  }

  const id = randomUUID()
  await prisma.$executeRawUnsafe(
    `INSERT INTO "voice_agents"
      ("id", "websiteId", "isActive", "name", "greeting", "systemPrompt", "language", "voiceStyle", "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    websiteDbId,
    input.isActive ? 1 : 0,
    input.name ?? 'Sesli Asistan',
    input.greeting ?? 'Merhaba, size nasıl yardımcı olabilirim?',
    input.systemPrompt ?? null,
    input.language ?? 'tr-TR',
    input.voiceStyle ?? 'friendly',
    now,
    now
  )
  return (await getVoiceAgent(websiteDbId))!
}
