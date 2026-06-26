import { prisma } from '@/lib/db'

export type AiFeatureFlags = {
  webSearchEnabled: boolean
  multimodalEnabled: boolean
  voiceAgentEnabled: boolean
  smartRoutingEnabled: boolean
}

const DEFAULTS: AiFeatureFlags = {
  webSearchEnabled: true,
  multimodalEnabled: true,
  voiceAgentEnabled: false,
  smartRoutingEnabled: true,
}

export async function getAiFeatureFlags(websiteDbId: string): Promise<AiFeatureFlags> {
  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        webSearchEnabled: number | boolean | null
        multimodalEnabled: number | boolean | null
        voiceAgentEnabled: number | boolean | null
        smartRoutingEnabled: number | boolean | null
      }>
    >(
      `SELECT "webSearchEnabled", "multimodalEnabled", "voiceAgentEnabled", "smartRoutingEnabled" FROM "ai_configs" WHERE "websiteId" = ? LIMIT 1`,
      websiteDbId
    )
    const row = rows[0]
    if (!row) return DEFAULTS
    return {
      webSearchEnabled: row.webSearchEnabled !== 0 && row.webSearchEnabled !== false,
      multimodalEnabled: row.multimodalEnabled !== 0 && row.multimodalEnabled !== false,
      voiceAgentEnabled: row.voiceAgentEnabled === 1 || row.voiceAgentEnabled === true,
      smartRoutingEnabled: row.smartRoutingEnabled !== 0 && row.smartRoutingEnabled !== false,
    }
  } catch {
    return DEFAULTS
  }
}

export async function saveAiFeatureFlags(
  websiteDbId: string,
  flags: Partial<AiFeatureFlags>
): Promise<void> {
  const current = await getAiFeatureFlags(websiteDbId)
  const next = { ...current, ...flags }
  const now = new Date().toISOString()

  const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT "id" FROM "ai_configs" WHERE "websiteId" = ? LIMIT 1`,
    websiteDbId
  )

  if (!existing[0]) {
    const { randomUUID } = await import('crypto')
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ai_configs"
        ("id", "websiteId", "isActive", "provider", "model", "apiKey", "temperature", "systemPrompt", "autoSuggest", "autoReply", "webSearchEnabled", "multimodalEnabled", "voiceAgentEnabled", "smartRoutingEnabled", "createdAt", "updatedAt")
       VALUES (?, ?, 0, 'GEMINI', 'gemini-2.0-flash', '', 0.7, '', 1, 0, ?, ?, ?, ?, ?, ?)`,
      randomUUID(),
      websiteDbId,
      next.webSearchEnabled ? 1 : 0,
      next.multimodalEnabled ? 1 : 0,
      next.voiceAgentEnabled ? 1 : 0,
      next.smartRoutingEnabled ? 1 : 0,
      now,
      now
    )
    return
  }

  await prisma.$executeRawUnsafe(
    `UPDATE "ai_configs" SET
      "webSearchEnabled" = ?,
      "multimodalEnabled" = ?,
      "voiceAgentEnabled" = ?,
      "smartRoutingEnabled" = ?,
      "updatedAt" = ?
     WHERE "websiteId" = ?`,
    next.webSearchEnabled ? 1 : 0,
    next.multimodalEnabled ? 1 : 0,
    next.voiceAgentEnabled ? 1 : 0,
    next.smartRoutingEnabled ? 1 : 0,
    new Date().toISOString(),
    websiteDbId
  )
}
