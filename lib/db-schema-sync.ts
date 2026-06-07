import { prisma } from './db'

/**
 * Prod Turso şemasını güvenli additive SQL ile günceller.
 * Widget, inbox ve cron route'larında çağrılır.
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
    // users — dashboard / agents-online
    { label: 'users.lastSeenAt', sql: `ALTER TABLE "users" ADD COLUMN "lastSeenAt" DATETIME` },
    { label: 'users.lastIp', sql: `ALTER TABLE "users" ADD COLUMN "lastIp" TEXT` },
    { label: 'users.activeWebsiteId', sql: `ALTER TABLE "users" ADD COLUMN "activeWebsiteId" TEXT` },
    { label: 'users.role', sql: `ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER'` },
    { label: 'users.isBanned', sql: `ALTER TABLE "users" ADD COLUMN "isBanned" BOOLEAN NOT NULL DEFAULT 0` },
    { label: 'users.isMuted', sql: `ALTER TABLE "users" ADD COLUMN "isMuted" BOOLEAN NOT NULL DEFAULT 0` },
    // websites — widget init
    { label: 'websites.showPreChatForm', sql: `ALTER TABLE "websites" ADD COLUMN "showPreChatForm" BOOLEAN NOT NULL DEFAULT 0` },
    { label: 'websites.requireName', sql: `ALTER TABLE "websites" ADD COLUMN "requireName" BOOLEAN NOT NULL DEFAULT 1` },
    { label: 'websites.requireEmail', sql: `ALTER TABLE "websites" ADD COLUMN "requireEmail" BOOLEAN NOT NULL DEFAULT 1` },
    { label: 'websites.cookieConsentEnabled', sql: `ALTER TABLE "websites" ADD COLUMN "cookieConsentEnabled" BOOLEAN NOT NULL DEFAULT 1` },
    { label: 'websites.showConsentBanner', sql: `ALTER TABLE "websites" ADD COLUMN "showConsentBanner" BOOLEAN NOT NULL DEFAULT 1` },
    { label: 'websites.avatarUrl', sql: `ALTER TABLE "websites" ADD COLUMN "avatarUrl" TEXT` },
    // visitors
    { label: 'visitors.avatarUrl', sql: `ALTER TABLE "visitors" ADD COLUMN "avatarUrl" TEXT` },
    { label: 'visitors.browser', sql: `ALTER TABLE "visitors" ADD COLUMN "browser" TEXT` },
    { label: 'visitors.os', sql: `ALTER TABLE "visitors" ADD COLUMN "os" TEXT` },
    { label: 'visitors.device', sql: `ALTER TABLE "visitors" ADD COLUMN "device" TEXT` },
    { label: 'visitors.phone', sql: `ALTER TABLE "visitors" ADD COLUMN "phone" TEXT` },
    // visitor_sessions
    { label: 'visitor_sessions.currentTitle', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "currentTitle" TEXT` },
    { label: 'visitor_sessions.ipAddress', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "ipAddress" TEXT` },
    { label: 'visitor_sessions.userAgent', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "userAgent" TEXT` },
    // conversations
    { label: 'conversations.source', sql: `ALTER TABLE "conversations" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'WIDGET'` },
    { label: 'conversations.visitorLang', sql: `ALTER TABLE "conversations" ADD COLUMN "visitorLang" TEXT` },
    { label: 'conversations.lastMessagePreview', sql: `ALTER TABLE "conversations" ADD COLUMN "lastMessagePreview" TEXT` },
    { label: 'conversations.unreadCount', sql: `ALTER TABLE "conversations" ADD COLUMN "unreadCount" INTEGER NOT NULL DEFAULT 0` },
    { label: 'conversations.assignedToId', sql: `ALTER TABLE "conversations" ADD COLUMN "assignedToId" TEXT` },
    { label: 'conversations.chatbotId', sql: `ALTER TABLE "conversations" ADD COLUMN "chatbotId" TEXT` },
    { label: 'conversations.chatbotStepIndex', sql: `ALTER TABLE "conversations" ADD COLUMN "chatbotStepIndex" INTEGER NOT NULL DEFAULT 0` },
    { label: 'conversations.chatbotCompleted', sql: `ALTER TABLE "conversations" ADD COLUMN "chatbotCompleted" BOOLEAN NOT NULL DEFAULT 0` },
    { label: 'conversations.chatbotHandedToAi', sql: `ALTER TABLE "conversations" ADD COLUMN "chatbotHandedToAi" BOOLEAN NOT NULL DEFAULT 0` },
    // messages
    { label: 'messages.sentiment', sql: `ALTER TABLE "messages" ADD COLUMN "sentiment" TEXT` },
    { label: 'messages.status', sql: `ALTER TABLE "messages" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SENT'` },
    { label: 'messages.readAt', sql: `ALTER TABLE "messages" ADD COLUMN "readAt" DATETIME` },
    { label: 'messages.deliveredAt', sql: `ALTER TABLE "messages" ADD COLUMN "deliveredAt" DATETIME` },
    // team_members
    { label: 'team_members.acceptedAt', sql: `ALTER TABLE "team_members" ADD COLUMN "acceptedAt" DATETIME` },
    { label: 'team_members.invitedAt', sql: `ALTER TABLE "team_members" ADD COLUMN "invitedAt" DATETIME` },
    { label: 'team_members.invitedBy', sql: `ALTER TABLE "team_members" ADD COLUMN "invitedBy" TEXT` },
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
