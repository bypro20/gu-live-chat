import { prisma } from './db'
import { generateWebsiteId } from './utils'

const MARKETING_DOMAIN = (process.env.MARKETING_WEBSITE_DOMAIN || 'guchat.org').toLowerCase()
const MARKETING_NAME = process.env.MARKETING_WEBSITE_NAME || 'Gu Chat — Platform'

/** Exact marketing domain match (substring değil). */
function marketingDomainFilter() {
  return {
    OR: [
      { domain: MARKETING_DOMAIN },
      { domain: `www.${MARKETING_DOMAIN}` },
    ],
  }
}

async function findMarketingWebsiteInDb() {
  return prisma.website.findFirst({
    where: marketingDomainFilter(),
    orderBy: { createdAt: 'asc' },
    select: { id: true, websiteId: true, name: true, domain: true },
  })
}

async function ensureTeamOwner(websiteInternalId: string, userId: string) {
  const member = await prisma.teamMember.findFirst({
    where: { websiteId: websiteInternalId, userId },
  })
  if (!member) {
    await prisma.teamMember.create({
      data: {
        websiteId: websiteInternalId,
        userId,
        role: 'OWNER',
        acceptedAt: new Date(),
      },
    })
  }
}

/** Tüm platform adminlerine marketing sitesi erişimi ver. */
async function ensureAllPlatformAdmins(websiteInternalId: string) {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  })
  await Promise.all(admins.map((a) => ensureTeamOwner(websiteInternalId, a.id)))
}

/**
 * Public websiteId for guchat.org widget.
 * Env override yalnızca DB'de karşılığı varsa kullanılır.
 */
export async function resolveMarketingWebsiteId(): Promise<string | null> {
  const override =
    process.env.NEXT_PUBLIC_WIDGET_WEBSITE_ID?.trim() ||
    process.env.NEXT_PUBLIC_MARKETING_WEBSITE_ID?.trim()

  if (override) {
    const site = await prisma.website.findUnique({
      where: { websiteId: override },
      select: { websiteId: true },
    })
    if (site) return site.websiteId
  }

  try {
    const site = await findMarketingWebsiteInDb()
    return site?.websiteId ?? null
  } catch {
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

/**
 * Marketing sitesi yoksa oluşturur; tüm ADMIN kullanıcıları OWNER yapar.
 */
export async function ensureMarketingWebsite(ownerUserId: string): Promise<string> {
  let siteId: string
  let sitePublicId: string

  const existing = await findMarketingWebsiteInDb()

  if (!existing) {
    const created = await prisma.website.create({
      data: {
        name: MARKETING_NAME,
        domain: MARKETING_DOMAIN,
        websiteId: generateWebsiteId(),
        ownerId: ownerUserId,
        welcomeMessage: 'Merhaba! 👋 Size nasıl yardımcı olabiliriz?',
        offlineMessage: 'Şu an çevrimdışıyız. Mesaj bırakın, size dönelim.',
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
    siteId = created.id
    sitePublicId = created.websiteId
  } else {
    siteId = existing.id
    sitePublicId = existing.websiteId
    await ensureTeamOwner(siteId, ownerUserId)
  }

  await ensureAllPlatformAdmins(siteId)
  return sitePublicId
}

/**
 * Admin gelen kutusu + widget aynı siteId. Her admin çağrısında erişim garanti.
 */
export async function ensureAdminMarketingAccess(adminUserId: string): Promise<string> {
  const resolved = await resolveMarketingWebsiteId()
  if (resolved) {
    const site = await prisma.website.findUnique({
      where: { websiteId: resolved },
      select: { id: true, websiteId: true },
    })
    if (site) {
      await ensureAllPlatformAdmins(site.id)
      return site.websiteId
    }
  }
  return ensureMarketingWebsite(adminUserId)
}

/** guchat.org sayfalarında widget — site yoksa admin ile bootstrap. */
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
    return null
  }
}
