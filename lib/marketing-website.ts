import { prisma } from './db'
import { generateWebsiteId } from './utils'
import { marketingDomainVariants, SITE_DOMAIN } from './site-config'
import { ensureMarketingSiteAiReady } from './marketing-ai-setup'
import { loadWebsiteAgentFields, saveWebsiteAgentFields } from './website-agent-fields'
import {
  MARKETING_AGENT_TITLE,
  MARKETING_PRIMARY_AGENT,
  MARKETING_WIDGET_DISPLAY_NAME,
  MARKETING_WIDGET_WELCOME,
} from './marketing-demo-agents'

const MARKETING_DOMAIN = (
  process.env.MARKETING_WEBSITE_DOMAIN || SITE_DOMAIN
)
  .toLowerCase()
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '')
const MARKETING_NAME = process.env.MARKETING_WEBSITE_NAME || 'Gu Live Chat — Platform'

let marketingAiBootstrap: Promise<void> | null = null

/** Idempotent KB + AI config — once per server instance on first marketing page load. */
function scheduleMarketingAiReady(websitePublicId: string): void {
  if (marketingAiBootstrap) return
  marketingAiBootstrap = (async () => {
    const site = await prisma.website.findUnique({
      where: { websiteId: websitePublicId },
      select: { id: true },
    })
    if (site) {
      await ensureMarketingSiteBranding(site.id)
      await ensureMarketingSiteAiReady(site.id)
    }
  })().catch((e) => {
    console.error('[marketing-website] AI bootstrap failed:', e)
    marketingAiBootstrap = null
  })
}

/** Marketing sitesini bul — domain varyantları + env override. */
async function findMarketingWebsiteInDb() {
  const override =
    process.env.NEXT_PUBLIC_WIDGET_WEBSITE_ID?.trim() ||
    process.env.NEXT_PUBLIC_MARKETING_WEBSITE_ID?.trim()

  if (override) {
    const byId = await prisma.website.findUnique({
      where: { websiteId: override },
      select: { id: true, websiteId: true, name: true, domain: true },
    })
    if (byId) return byId
  }

  return prisma.website.findFirst({
    where: { domain: { in: marketingDomainVariants() } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, websiteId: true, name: true, domain: true },
  })
}

async function ensureTeamOwner(websiteInternalId: string, userId: string) {
  try {
    await prisma.teamMember.upsert({
      where: {
        userId_websiteId: { userId, websiteId: websiteInternalId },
      },
      create: {
        websiteId: websiteInternalId,
        userId,
        role: 'OWNER',
        acceptedAt: new Date(),
      },
      update: { role: 'OWNER', acceptedAt: new Date() },
    })
  } catch (e) {
    // Eski şema / yarış durumu — sessizce yoksay
    console.warn('[marketing-website] team upsert:', e)
  }
}

/** Platform marketing sitesi tüm özelliklerle (BUSINESS) çalışsın. */
async function ensureMarketingSiteProPlan(websiteInternalId: string) {
  try {
    await prisma.website.update({
      where: { id: websiteInternalId },
      data: {
        plan: 'BUSINESS',
        subscriptionStatus: 'ACTIVE',
      },
    })
  } catch (e) {
    console.warn('[marketing-website] pro plan upgrade:', e)
  }
}

/** Marketing sitesinde yalnızca boş/legacy alanları doldurur — panelden yapılan özelleştirmeleri silmez. */
async function ensureMarketingSiteBranding(websiteInternalId: string) {
  try {
    const current = await prisma.website.findUnique({
      where: { id: websiteInternalId },
      select: {
        name: true,
        domain: true,
        avatarUrl: true,
        welcomeMessage: true,
        showPreChatForm: true,
        requireName: true,
        requireEmail: true,
      },
    })
    if (!current) return

    const patch: Record<string, unknown> = {
      showPreChatForm: false,
      requireName: false,
      requireEmail: false,
    }

    if (!current.domain || current.domain !== MARKETING_DOMAIN) {
      patch.domain = MARKETING_DOMAIN
    }

    const legacyName =
      !current.name ||
      current.name === 'Gu Live Chat — Platform' ||
      current.name.includes('Gu Live Chat')
    if (legacyName) {
      patch.name = MARKETING_WIDGET_DISPLAY_NAME
    }
    if (!current.avatarUrl?.trim()) {
      patch.avatarUrl = MARKETING_PRIMARY_AGENT.image
    }
    if (!current.welcomeMessage?.trim()) {
      patch.welcomeMessage = MARKETING_WIDGET_WELCOME
    }

    await prisma.website.update({
      where: { id: websiteInternalId },
      data: patch,
    })

    const agentFields = await loadWebsiteAgentFields(websiteInternalId)
    await saveWebsiteAgentFields(websiteInternalId, {
      agentDisplayName:
        agentFields.agentDisplayName?.trim() || MARKETING_PRIMARY_AGENT.fullName,
      agentTitle: agentFields.agentTitle?.trim() || MARKETING_AGENT_TITLE,
    })
  } catch (e) {
    console.warn('[marketing-website] branding sync:', e)
  }
}

async function ensureAllPlatformAdmins(websiteInternalId: string) {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  })
  for (const admin of admins) {
    await ensureTeamOwner(websiteInternalId, admin.id)
  }
}

export async function resolveMarketingWebsiteId(): Promise<string | null> {
  try {
    const site = await findMarketingWebsiteInDb()
    return site?.websiteId ?? null
  } catch (e) {
    console.error('[marketing-website] resolve failed:', e)
    return null
  }
}

export async function isPlatformMarketingWebsiteId(
  websiteId: string | null | undefined
): Promise<boolean> {
  if (!websiteId) return false
  const marketingId = await resolveMarketingWebsiteId()
  return marketingId === websiteId
}

/** Client/server — env ile bilinen marketing site public id. */
export function isKnownMarketingWebsitePublicId(websiteId: string | null | undefined): boolean {
  if (!websiteId) return false
  const ids = [
    process.env.NEXT_PUBLIC_MARKETING_WEBSITE_ID?.trim(),
    process.env.NEXT_PUBLIC_WIDGET_WEBSITE_ID?.trim(),
  ].filter(Boolean)
  return ids.includes(websiteId)
}

export async function ensureMarketingWebsite(ownerUserId: string): Promise<string> {
  const existing = await findMarketingWebsiteInDb()

  if (existing) {
    await ensureTeamOwner(existing.id, ownerUserId)
    await ensureMarketingSiteProPlan(existing.id)
    await ensureMarketingSiteBranding(existing.id)
    await ensureAllPlatformAdmins(existing.id)
    await ensureMarketingSiteAiReady(existing.id)
    return existing.websiteId
  }

  try {
    const created = await prisma.website.create({
      data: {
        name: MARKETING_WIDGET_DISPLAY_NAME,
        domain: MARKETING_DOMAIN,
        websiteId: generateWebsiteId(),
        ownerId: ownerUserId,
        avatarUrl: MARKETING_PRIMARY_AGENT.image,
        welcomeMessage: MARKETING_WIDGET_WELCOME,
        offlineMessage: 'Şu an çevrimdışıyız. Mesaj bırakın, size dönelim.',
        showPreChatForm: false,
        requireName: false,
        requireEmail: false,
        plan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        members: {
          create: {
            userId: ownerUserId,
            role: 'OWNER',
            acceptedAt: new Date(),
          },
        },
      },
      select: { id: true, websiteId: true },
    })
    await prisma.$executeRawUnsafe(
      `UPDATE websites SET agentDisplayName = ?, agentTitle = ? WHERE id = ?`,
      MARKETING_PRIMARY_AGENT.fullName,
      MARKETING_AGENT_TITLE,
      created.id
    )
    await ensureAllPlatformAdmins(created.id)
    await ensureMarketingSiteAiReady(created.id)
    return created.websiteId
  } catch (createError) {
    console.error('[marketing-website] create failed, retrying find:', createError)
    const retry = await findMarketingWebsiteInDb()
    if (retry) {
      await ensureTeamOwner(retry.id, ownerUserId)
      await ensureMarketingSiteProPlan(retry.id)
      await ensureAllPlatformAdmins(retry.id)
      return retry.websiteId
    }
    throw createError
  }
}

export async function ensureAdminMarketingAccess(adminUserId: string): Promise<string> {
  try {
    const resolved = await resolveMarketingWebsiteId()
    if (resolved) {
      const site = await prisma.website.findUnique({
        where: { websiteId: resolved },
        select: { id: true, websiteId: true },
      })
      if (site) {
        await ensureMarketingSiteProPlan(site.id)
        await ensureMarketingSiteBranding(site.id)
        await ensureAllPlatformAdmins(site.id)
        await ensureMarketingSiteAiReady(site.id)
        return site.websiteId
      }
    }
    return await ensureMarketingWebsite(adminUserId)
  } catch (e) {
    console.error('[ensureAdminMarketingAccess] primary failed:', e)
    const member = await prisma.teamMember.findFirst({
      where: { userId: adminUserId },
      include: { website: { select: { id: true, websiteId: true } } },
      orderBy: { acceptedAt: 'desc' },
    })
    if (member?.website) {
      await ensureAllPlatformAdmins(member.website.id)
      return member.website.websiteId
    }
    throw e
  }
}

export async function resolveOrBootstrapMarketingWebsiteId(): Promise<string | null> {
  try {
    const existing = await resolveMarketingWebsiteId()
    if (existing) {
      scheduleMarketingAiReady(existing)
      return existing
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim()
    const admin = adminEmail
      ? await prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true } })
      : await prisma.user.findFirst({
          where: { role: 'ADMIN' },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        })

    if (!admin) return null
    return await ensureMarketingWebsite(admin.id)
  } catch (e) {
    console.error('[marketing-website] bootstrap failed:', e)
    return await resolveMarketingWebsiteId()
  }
}
