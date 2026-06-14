import { prisma } from './db'
import { WIDGET_IDENTITY_CREATE_DATA } from './widget-platform-defaults'

/** myqar.net — myQR projesinin Gu Live Chat widget kimliği (prod ile aynı ID). */
export const MYQR_PUBLIC_WEBSITE_ID =
  process.env.MYQR_WEBSITE_ID?.trim() || 'tq7mpR888X9QUtbnh5V7aHQV'

export const MYQR_DOMAIN = (process.env.MYQR_DOMAIN || 'myqar.net').toLowerCase()
export const MYQR_NAME = process.env.MYQR_WEBSITE_NAME || 'myQR'
export const MYQR_OWNER_EMAIL = process.env.MYQR_OWNER_EMAIL?.trim() || 'bypro1988@gmail.com'

export const MYQR_WIDGET_SETTINGS = {
  ...WIDGET_IDENTITY_CREATE_DATA,
  showConsentBanner: false,
  cookieConsentEnabled: false,
  primaryColor: '#6366F1',
  welcomeMessage: 'Merhaba! 👋 myQR destek ekibine hoş geldiniz. Size nasıl yardımcı olabiliriz?',
  offlineMessage: 'Şu an çevrimdışıyız. Mesaj bırakın, size dönelim.',
  plan: 'PRO' as const,
  subscriptionStatus: 'ACTIVE' as const,
}

export type MyQrSiteRef = {
  id: string
  websiteId: string
  name: string
  domain: string
}

async function resolveOwnerId(): Promise<string> {
  const byEmail = await prisma.user.findUnique({
    where: { email: MYQR_OWNER_EMAIL },
    select: { id: true },
  })
  if (byEmail) return byEmail.id

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  if (!admin) throw new Error(`Sahip bulunamadı (${MYQR_OWNER_EMAIL}) ve admin yok`)
  return admin.id
}

async function ensureAdminTeamAccess(websiteInternalId: string) {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  })
  for (const admin of admins) {
    await prisma.teamMember.upsert({
      where: { userId_websiteId: { userId: admin.id, websiteId: websiteInternalId } },
      create: {
        userId: admin.id,
        websiteId: websiteInternalId,
        role: 'OWNER',
        acceptedAt: new Date(),
      },
      update: { role: 'OWNER', acceptedAt: new Date() },
    })
  }
}

export async function findMyQrWebsite(): Promise<MyQrSiteRef | null> {
  return prisma.website.findUnique({
    where: { websiteId: MYQR_PUBLIC_WEBSITE_ID },
    select: { id: true, websiteId: true, name: true, domain: true },
  })
}

export async function isMyQrWebsiteId(websiteId: string | null | undefined): Promise<boolean> {
  if (!websiteId) return false
  return websiteId === MYQR_PUBLIC_WEBSITE_ID
}

/** Yerel / prod DB'de myQR sitesini sabit websiteId ile oluştur veya senkronize et. */
export async function ensureMyQrWebsite(): Promise<MyQrSiteRef> {
  const ownerId = await resolveOwnerId()
  const existing = await findMyQrWebsite()

  if (existing) {
    await prisma.website.update({
      where: { id: existing.id },
      data: {
        name: MYQR_NAME,
        domain: MYQR_DOMAIN,
        ownerId,
        ...MYQR_WIDGET_SETTINGS,
      },
    })
    await ensureAdminTeamAccess(existing.id)
    return existing
  }

  const created = await prisma.website.create({
    data: {
      name: MYQR_NAME,
      domain: MYQR_DOMAIN,
      websiteId: MYQR_PUBLIC_WEBSITE_ID,
      ownerId,
      ...MYQR_WIDGET_SETTINGS,
      members: {
        create: { userId: ownerId, role: 'OWNER', acceptedAt: new Date() },
      },
    },
    select: { id: true, websiteId: true, name: true, domain: true },
  })

  await ensureAdminTeamAccess(created.id)
  return created
}
