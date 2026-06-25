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
      label: 'ip_bans',
      sql: `CREATE TABLE IF NOT EXISTS "ip_bans" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "ipAddress" TEXT NOT NULL,
        "reason" TEXT,
        "bannedBy" TEXT,
        "expiresAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      label: 'platform_settings',
      sql: `CREATE TABLE IF NOT EXISTS "platform_settings" (
        "key" TEXT NOT NULL PRIMARY KEY,
        "value" TEXT NOT NULL,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      label: 'addons',
      sql: `CREATE TABLE IF NOT EXISTS "addons" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "slug" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "longDescription" TEXT,
        "category" TEXT NOT NULL DEFAULT 'CUSTOM',
        "icon" TEXT,
        "imageUrl" TEXT,
        "price" INTEGER NOT NULL DEFAULT 0,
        "purchaseType" TEXT NOT NULL DEFAULT 'MONTHLY',
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "isFeatured" BOOLEAN NOT NULL DEFAULT 0,
        "version" TEXT NOT NULL DEFAULT '1.0.0',
        "developer" TEXT NOT NULL DEFAULT 'Gu Live Chat',
        "docsUrl" TEXT,
        "configSchema" TEXT,
        "permissions" TEXT,
        "setupGuide" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      label: 'addon_purchases',
      sql: `CREATE TABLE IF NOT EXISTS "addon_purchases" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "websiteId" TEXT NOT NULL,
        "addonId" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "config" TEXT,
        "autoRenew" BOOLEAN NOT NULL DEFAULT 1,
        "expiresAt" DATETIME,
        "cancelledAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      label: 'ai_configs',
      sql: `CREATE TABLE IF NOT EXISTS "ai_configs" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "websiteId" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT 0,
        "provider" TEXT NOT NULL DEFAULT 'OPENAI',
        "model" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
        "apiKey" TEXT NOT NULL DEFAULT '',
        "temperature" REAL NOT NULL DEFAULT 0.7,
        "systemPrompt" TEXT,
        "autoSuggest" BOOLEAN NOT NULL DEFAULT 1,
        "autoReply" BOOLEAN NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      label: 'visitor_sessions',
      sql: `CREATE TABLE IF NOT EXISTS "visitor_sessions" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "visitorId" TEXT NOT NULL,
        "websiteId" TEXT NOT NULL,
        "sessionId" TEXT NOT NULL,
        "landingPage" TEXT,
        "currentPage" TEXT,
        "currentTitle" TEXT,
        "referrer" TEXT,
        "userAgent" TEXT,
        "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "endedAt" DATETIME
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
    { label: 'visitors.country', sql: `ALTER TABLE "visitors" ADD COLUMN "country" TEXT` },
    { label: 'visitors.city', sql: `ALTER TABLE "visitors" ADD COLUMN "city" TEXT` },
    { label: 'visitors.timezone', sql: `ALTER TABLE "visitors" ADD COLUMN "timezone" TEXT` },
    { label: 'visitors.notes', sql: `ALTER TABLE "visitors" ADD COLUMN "notes" TEXT` },
    { label: 'visitors.customData', sql: `ALTER TABLE "visitors" ADD COLUMN "customData" TEXT` },
    // visitor_sessions
    { label: 'visitor_sessions.currentTitle', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "currentTitle" TEXT` },
    { label: 'visitor_sessions.ipAddress', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "ipAddress" TEXT` },
    { label: 'visitor_sessions.userAgent', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "userAgent" TEXT` },
    { label: 'visitor_sessions.referrer', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "referrer" TEXT` },
    { label: 'visitor_sessions.utmSource', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "utmSource" TEXT` },
    { label: 'visitor_sessions.utmMedium', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "utmMedium" TEXT` },
    { label: 'visitor_sessions.utmCampaign', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "utmCampaign" TEXT` },
    { label: 'visitor_sessions.country', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "country" TEXT` },
    { label: 'visitor_sessions.city', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "city" TEXT` },
    { label: 'visitor_sessions.region', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "region" TEXT` },
    { label: 'visitor_sessions.latitude', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "latitude" REAL` },
    { label: 'visitor_sessions.longitude', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "longitude" REAL` },
    { label: 'visitor_sessions.isp', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "isp" TEXT` },
    { label: 'visitor_sessions.timezone', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "timezone" TEXT` },
    { label: 'visitor_sessions.browser', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "browser" TEXT` },
    { label: 'visitor_sessions.os', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "os" TEXT` },
    { label: 'visitor_sessions.device', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "device" TEXT` },
    { label: 'visitor_sessions.deviceType', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "deviceType" TEXT` },
    { label: 'visitor_sessions.district', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "district" TEXT` },
    { label: 'visitor_sessions.postalCode', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "postalCode" TEXT` },
    { label: 'visitor_sessions.geoAddress', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "geoAddress" TEXT` },
    { label: 'visitor_sessions.geoSource', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "geoSource" TEXT` },
    { label: 'visitor_sessions.entrySource', sql: `ALTER TABLE "visitor_sessions" ADD COLUMN "entrySource" TEXT` },
    { label: 'visitor_sessions.sessionId_unique', sql: `CREATE UNIQUE INDEX IF NOT EXISTS "visitor_sessions_sessionId_key" ON "visitor_sessions"("sessionId")` },
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
    {
      label: 'chatbots',
      sql: `CREATE TABLE IF NOT EXISTS "chatbots" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "websiteId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "trigger" TEXT NOT NULL DEFAULT 'ALL_CONVERSATIONS',
        "triggerValue" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    {
      label: 'chatbot_steps',
      sql: `CREATE TABLE IF NOT EXISTS "chatbot_steps" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "chatbotId" TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        "type" TEXT NOT NULL,
        "message" TEXT,
        "options" TEXT,
        "nextStepId" TEXT
      )`,
    },
    { label: 'chatbots.triggerValue', sql: `ALTER TABLE "chatbots" ADD COLUMN "triggerValue" TEXT` },
    // messages
    { label: 'messages.sentiment', sql: `ALTER TABLE "messages" ADD COLUMN "sentiment" TEXT` },
    { label: 'messages.status', sql: `ALTER TABLE "messages" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SENT'` },
    { label: 'messages.readAt', sql: `ALTER TABLE "messages" ADD COLUMN "readAt" DATETIME` },
    { label: 'messages.deliveredAt', sql: `ALTER TABLE "messages" ADD COLUMN "deliveredAt" DATETIME` },
    // team_members
    { label: 'team_members.acceptedAt', sql: `ALTER TABLE "team_members" ADD COLUMN "acceptedAt" DATETIME` },
    { label: 'team_members.invitedAt', sql: `ALTER TABLE "team_members" ADD COLUMN "invitedAt" DATETIME` },
    { label: 'team_members.invitedBy', sql: `ALTER TABLE "team_members" ADD COLUMN "invitedBy" TEXT` },
    { label: 'websites.trialBonusWidgetGranted', sql: `ALTER TABLE "websites" ADD COLUMN "trialBonusWidgetGranted" BOOLEAN NOT NULL DEFAULT 0` },
    { label: 'websites.trialBonusChatGranted', sql: `ALTER TABLE "websites" ADD COLUMN "trialBonusChatGranted" BOOLEAN NOT NULL DEFAULT 0` },
    { label: 'websites.signupUtmSource', sql: `ALTER TABLE "websites" ADD COLUMN "signupUtmSource" TEXT` },
    { label: 'websites.signupUtmMedium', sql: `ALTER TABLE "websites" ADD COLUMN "signupUtmMedium" TEXT` },
    { label: 'websites.signupUtmCampaign', sql: `ALTER TABLE "websites" ADD COLUMN "signupUtmCampaign" TEXT` },
    { label: 'websites.signupUtmContent', sql: `ALTER TABLE "websites" ADD COLUMN "signupUtmContent" TEXT` },
    { label: 'websites.signupUtmTerm', sql: `ALTER TABLE "websites" ADD COLUMN "signupUtmTerm" TEXT` },
    { label: 'websites.signupReferrer', sql: `ALTER TABLE "websites" ADD COLUMN "signupReferrer" TEXT` },
    { label: 'websites.referralCode', sql: `ALTER TABLE "websites" ADD COLUMN "referralCode" TEXT` },
    { label: 'websites.signupLandingPage', sql: `ALTER TABLE "websites" ADD COLUMN "signupLandingPage" TEXT` },
    // campaigns — A/B test
    { label: 'campaigns.abTestEnabled', sql: `ALTER TABLE "campaigns" ADD COLUMN "abTestEnabled" BOOLEAN NOT NULL DEFAULT 0` },
    { label: 'campaigns.variantBSubject', sql: `ALTER TABLE "campaigns" ADD COLUMN "variantBSubject" TEXT` },
    { label: 'campaigns.variantBContent', sql: `ALTER TABLE "campaigns" ADD COLUMN "variantBContent" TEXT` },
    { label: 'campaigns.abSplitPercent', sql: `ALTER TABLE "campaigns" ADD COLUMN "abSplitPercent" INTEGER NOT NULL DEFAULT 50` },
    { label: 'campaigns.variantASentCount', sql: `ALTER TABLE "campaigns" ADD COLUMN "variantASentCount" INTEGER NOT NULL DEFAULT 0` },
    { label: 'campaigns.variantBSentCount', sql: `ALTER TABLE "campaigns" ADD COLUMN "variantBSentCount" INTEGER NOT NULL DEFAULT 0` },
    { label: 'campaigns.variantAOpenCount', sql: `ALTER TABLE "campaigns" ADD COLUMN "variantAOpenCount" INTEGER NOT NULL DEFAULT 0` },
    { label: 'campaigns.variantBOpenCount', sql: `ALTER TABLE "campaigns" ADD COLUMN "variantBOpenCount" INTEGER NOT NULL DEFAULT 0` },
    { label: 'campaigns.variantAClickCount', sql: `ALTER TABLE "campaigns" ADD COLUMN "variantAClickCount" INTEGER NOT NULL DEFAULT 0` },
    { label: 'campaigns.variantBClickCount', sql: `ALTER TABLE "campaigns" ADD COLUMN "variantBClickCount" INTEGER NOT NULL DEFAULT 0` },
    {
      label: 'marketing_blog_posts',
      sql: `CREATE TABLE IF NOT EXISTS "marketing_blog_posts" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "slug" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "excerpt" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "keywords" TEXT NOT NULL DEFAULT '[]',
        "locale" TEXT NOT NULL DEFAULT 'tr',
        "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "source" TEXT NOT NULL DEFAULT 'auto',
        "taskId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    { label: 'marketing_blog_posts.slug_unique', sql: `CREATE UNIQUE INDEX IF NOT EXISTS "marketing_blog_posts_slug_key" ON "marketing_blog_posts"("slug")` },
    { label: 'marketing_blog_posts.publishedAt_idx', sql: `CREATE INDEX IF NOT EXISTS "marketing_blog_posts_publishedAt_idx" ON "marketing_blog_posts"("publishedAt")` },
    {
      label: 'admin_mail_messages',
      sql: `CREATE TABLE IF NOT EXISTS "admin_mail_messages" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "source" TEXT NOT NULL DEFAULT 'contact-form',
        "fromName" TEXT,
        "fromEmail" TEXT,
        "subject" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "htmlBody" TEXT,
        "status" TEXT NOT NULL DEFAULT 'unread',
        "starred" BOOLEAN NOT NULL DEFAULT 0,
        "metadata" TEXT,
        "repliedAt" DATETIME,
        "replyBody" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    },
    { label: 'admin_mail_messages.status_idx', sql: `CREATE INDEX IF NOT EXISTS "admin_mail_messages_status_createdAt_idx" ON "admin_mail_messages"("status", "createdAt")` },
    { label: 'admin_mail_messages.source_idx', sql: `CREATE INDEX IF NOT EXISTS "admin_mail_messages_source_createdAt_idx" ON "admin_mail_messages"("source", "createdAt")` },
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
