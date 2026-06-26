import { prisma } from './db'

export type WebsiteAgentSlice = {
  agentDisplayName: string | null
  agentTitle: string | null
}

const EMPTY: WebsiteAgentSlice = {
  agentDisplayName: null,
  agentTitle: null,
}

/** Reads agent persona columns; safe when Prisma client or DB column is still syncing. */
export async function loadWebsiteAgentFields(websiteDbId: string): Promise<WebsiteAgentSlice> {
  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ agentDisplayName: string | null; agentTitle: string | null }>
    >(
      `SELECT agentDisplayName, agentTitle FROM websites WHERE id = ? LIMIT 1`,
      websiteDbId
    )
    return rows?.[0] ?? EMPTY
  } catch {
    return EMPTY
  }
}

export async function saveWebsiteAgentFields(
  websiteDbId: string,
  fields: Partial<WebsiteAgentSlice>
): Promise<void> {
  if (fields.agentDisplayName === undefined && fields.agentTitle === undefined) return
  const current = await loadWebsiteAgentFields(websiteDbId)
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE websites SET agentDisplayName = ?, agentTitle = ? WHERE id = ?`,
      fields.agentDisplayName !== undefined ? fields.agentDisplayName : current.agentDisplayName,
      fields.agentTitle !== undefined ? fields.agentTitle : current.agentTitle,
      websiteDbId
    )
  } catch {
    /* column may not exist yet — db-schema-sync will add on next request */
  }
}

export const websiteAgentFieldSelect = {
  agentDisplayName: true,
  agentTitle: true,
} as const
