import { prisma } from '@/lib/db'
import { syncProductionSchema } from '@/lib/db-schema-sync'

export type AdminMailSource = 'contact-form' | 'organic-marketing' | 'system'
export type AdminMailStatus = 'unread' | 'read' | 'archived'

export type AdminMailMessage = {
  id: string
  source: AdminMailSource
  fromName: string | null
  fromEmail: string | null
  subject: string
  body: string
  htmlBody: string | null
  status: AdminMailStatus
  starred: boolean
  metadata: Record<string, unknown> | null
  repliedAt: string | null
  replyBody: string | null
  createdAt: string
  updatedAt: string
}

type Row = {
  id: string
  source: string
  fromName: string | null
  fromEmail: string | null
  subject: string
  body: string
  htmlBody: string | null
  status: string
  starred: number | boolean
  metadata: string | null
  repliedAt: string | null
  replyBody: string | null
  createdAt: string
  updatedAt: string
}

function rowToMessage(row: Row): AdminMailMessage {
  let metadata: Record<string, unknown> | null = null
  if (row.metadata) {
    try {
      metadata = JSON.parse(row.metadata) as Record<string, unknown>
    } catch {
      metadata = null
    }
  }
  return {
    id: row.id,
    source: row.source as AdminMailSource,
    fromName: row.fromName,
    fromEmail: row.fromEmail,
    subject: row.subject,
    body: row.body,
    htmlBody: row.htmlBody,
    status: row.status as AdminMailStatus,
    starred: Boolean(row.starred),
    metadata,
    repliedAt: row.repliedAt,
    replyBody: row.replyBody,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

async function ensureTable() {
  await syncProductionSchema().catch(() => {})
}

export async function createAdminMailMessage(input: {
  source: AdminMailSource
  fromName?: string | null
  fromEmail?: string | null
  subject: string
  body: string
  htmlBody?: string | null
  metadata?: Record<string, unknown>
}): Promise<AdminMailMessage> {
  await ensureTable()
  const id = `mail_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
  const now = new Date().toISOString()
  const metadata = input.metadata ? JSON.stringify(input.metadata) : null

  await prisma.$executeRaw`
    INSERT INTO admin_mail_messages (
      id, source, fromName, fromEmail, subject, body, htmlBody, status, starred, metadata, createdAt, updatedAt
    ) VALUES (
      ${id},
      ${input.source},
      ${input.fromName ?? null},
      ${input.fromEmail ?? null},
      ${input.subject},
      ${input.body},
      ${input.htmlBody ?? null},
      'unread',
      0,
      ${metadata},
      ${now},
      ${now}
    )
  `

  return {
    id,
    source: input.source,
    fromName: input.fromName ?? null,
    fromEmail: input.fromEmail ?? null,
    subject: input.subject,
    body: input.body,
    htmlBody: input.htmlBody ?? null,
    status: 'unread',
    starred: false,
    metadata: input.metadata ?? null,
    repliedAt: null,
    replyBody: null,
    createdAt: now,
    updatedAt: now,
  }
}

export async function listAdminMailMessages(options?: {
  status?: AdminMailStatus | 'all'
  source?: AdminMailSource | 'all'
  q?: string
  limit?: number
}): Promise<AdminMailMessage[]> {
  await ensureTable()
  const limit = Math.min(options?.limit ?? 100, 200)

  try {
    const rows = await prisma.$queryRaw<Row[]>`
      SELECT id, source, fromName, fromEmail, subject, body, htmlBody, status, starred, metadata, repliedAt, replyBody, createdAt, updatedAt
      FROM admin_mail_messages
      ORDER BY createdAt DESC
      LIMIT ${limit}
    `

    let items = rows.map(rowToMessage)

    if (options?.status && options.status !== 'all') {
      items = items.filter((m) => m.status === options.status)
    }
    if (options?.source && options.source !== 'all') {
      items = items.filter((m) => m.source === options.source)
    }
    if (options?.q?.trim()) {
      const q = options.q.trim().toLowerCase()
      items = items.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.body.toLowerCase().includes(q) ||
          m.fromEmail?.toLowerCase().includes(q) ||
          m.fromName?.toLowerCase().includes(q)
      )
    }

    return items
  } catch {
    return []
  }
}

export async function getAdminMailMessage(id: string): Promise<AdminMailMessage | null> {
  await ensureTable()
  try {
    const rows = await prisma.$queryRaw<Row[]>`
      SELECT id, source, fromName, fromEmail, subject, body, htmlBody, status, starred, metadata, repliedAt, replyBody, createdAt, updatedAt
      FROM admin_mail_messages
      WHERE id = ${id}
      LIMIT 1
    `
    return rows[0] ? rowToMessage(rows[0]) : null
  } catch {
    return null
  }
}

export async function updateAdminMailMessage(
  id: string,
  patch: Partial<{
    status: AdminMailStatus
    starred: boolean
    replyBody: string
    repliedAt: string
  }>
): Promise<AdminMailMessage | null> {
  await ensureTable()
  const existing = await getAdminMailMessage(id)
  if (!existing) return null

  const status = patch.status ?? existing.status
  const starred = patch.starred ?? existing.starred
  const replyBody = patch.replyBody ?? existing.replyBody
  const repliedAt = patch.repliedAt ?? existing.repliedAt
  const now = new Date().toISOString()

  await prisma.$executeRaw`
    UPDATE admin_mail_messages
    SET status = ${status},
        starred = ${starred ? 1 : 0},
        replyBody = ${replyBody},
        repliedAt = ${repliedAt},
        updatedAt = ${now}
    WHERE id = ${id}
  `

  return getAdminMailMessage(id)
}

export async function countUnreadAdminMail(): Promise<number> {
  await ensureTable()
  try {
    const rows = await prisma.$queryRaw<Array<{ c: number }>>`
      SELECT COUNT(*) as c FROM admin_mail_messages WHERE status = 'unread'
    `
    return Number(rows[0]?.c ?? 0)
  } catch {
    return 0
  }
}

export const ADMIN_MAIL_SOURCE_LABELS: Record<AdminMailSource, string> = {
  'contact-form': 'İletişim Formu',
  'organic-marketing': 'Pazarlama Botu',
  system: 'Sistem',
}
