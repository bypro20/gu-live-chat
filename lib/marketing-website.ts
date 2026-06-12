import { prisma } from './db'
import { generateWebsiteId } from './utils'
import { marketingDomainVariants, SITE_DOMAIN } from './site-config'

const MARKETING_DOMAIN = (
  process.env.MARKETING_WEBSITE_DOMAIN || SITE_DOMAIN
)
  .toLowerCase()
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '')
const MARKETING_NAME = process.env.MARKETING_WEBSITE_NAME || 'Gu Live Chat — Platform'

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

/** Platform marketing sitesi tüm PRO özelliklerle çalışsın. */
async function ensureMarketingSiteProPlan(websiteInternalId: string) {
  try {
    await prisma.website.update({
      where: { id: websiteInternalId },
      data: {
        plan: 'PRO',
        subscriptionStatus: 'ACTIVE',
      },
    })
  } catch (e) {
    console.warn('[marketing-website] pro plan upgrade:', e)
  }
}

/** Canlı DB'deki marketing sitesi adı/domain'i güncel marka ile senkronize et */
async function ensureMarketingSiteBranding(websiteInternalId: string) {
  try {
    await prisma.website.update({
      where: { id: websiteInternalId },
      data: {
        name: MARKETING_NAME,
        domain: MARKETING_DOMAIN,
      },
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

export async function ensureMarketingWebsite(ownerUserId: string): Promise<string> {
  const existing = await findMarketingWebsiteInDb()

  if (existing) {
    await ensureTeamOwner(existing.id, ownerUserId)
    await ensureMarketingSiteProPlan(existing.id)
    await ensureMarketingSiteBranding(existing.id)
    await ensureAllPlatformAdmins(existing.id)
    return existing.websiteId
  }

  try {
    const created = await prisma.website.create({
      data: {
        name: MARKETING_NAME,
        domain: MARKETING_DOMAIN,
        websiteId: generateWebsiteId(),
        ownerId: ownerUserId,
        welcomeMessage: 'Merhaba! 👋 Size nasıl yardımcı olabiliriz?',
        offlineMessage: 'Şu an çevrimdışıyız. Mesaj bırakın, size dönelim.',
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
    await ensureAllPlatformAdmins(created.id)
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
    if (existing) return existing

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
