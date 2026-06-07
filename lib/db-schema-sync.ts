import { prisma } from './db'

/**
 * Prod Turso şemasını güvenli additive SQL ile günceller.
 * seed-admin ve schema-sync cron'da çağrılır.
 */
export async function syncProductionSchema(): Promise<{ applied: string[]; skipped: string[] }> {
  const applied: string[] = []
  const skipped: string[] = []

  const statements: Array<{ label: string; sql: string }> = [
    {
      label: 'platform_settings',
      sql: `CREATE TABLE IF NOT EXISTS "platform_settings" (
        "key" TEXT NOT NULL PRIMARY KEY,
        "value" TEXT NOT NULL,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      label: 'websites.showPreChatForm',
      sql: `ALTER TABLE "websites" ADD COLUMN "showPreChatForm" BOOLEAN NOT NULL DEFAULT 0`,
    },
    {
      label: 'websites.requireName',
      sql: `ALTER TABLE "websites" ADD COLUMN "requireName" BOOLEAN NOT NULL DEFAULT 1`,
    },
    {
      label: 'websites.requireEmail',
      sql: `ALTER TABLE "websites" ADD COLUMN "requireEmail" BOOLEAN NOT NULL DEFAULT 1`,
    },
    {
      label: 'websites.cookieConsentEnabled',
      sql: `ALTER TABLE "websites" ADD COLUMN "cookieConsentEnabled" BOOLEAN NOT NULL DEFAULT 1`,
    },
    {
      label: 'websites.showConsentBanner',
      sql: `ALTER TABLE "websites" ADD COLUMN "showConsentBanner" BOOLEAN NOT NULL DEFAULT 1`,
    },
  ]

  for (const { label, sql } of statements) {
    try {
      await prisma.$executeRawUnsafe(sql)
      applied.push(label)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('duplicate column') || msg.includes('already exists')) {
        skipped.push(label)
      } else {
        console.warn(`[schema-sync] ${label}:`, msg)
        skipped.push(label)
      }
    }
  }

  return { applied, skipped }
}
