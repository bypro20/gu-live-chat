import { prisma } from './db'
import {
  createPaymentToken,
  generateAddonMerchantOid,
  getPaytrIframeUrl,
  isPaytrConfigured,
} from './paytr'

export async function initiateAddonCheckout(
  websitePublicId: string,
  addonSlug: string,
  userEmail: string,
  userName: string,
  userPhone: string,
  userIp: string
): Promise<{ token: string; merchantOid: string; iframeUrl: string } | { error: string }> {
  if (!isPaytrConfigured()) {
    return { error: 'Ödeme sistemi yapılandırılmamış' }
  }

  const website = await prisma.website.findUnique({
    where: { websiteId: websitePublicId },
    select: { id: true, websiteId: true },
  })
  if (!website) return { error: 'Site bulunamadı' }

  const addon = await prisma.addon.findUnique({
    where: { slug: addonSlug, isActive: true },
  })
  if (!addon) return { error: 'Eklenti bulunamadı' }
  if (addon.price <= 0) return { error: 'Bu eklenti ücretsiz — doğrudan etkinleştirin' }

  const existing = await prisma.addonPurchase.findUnique({
    where: { websiteId_addonId: { websiteId: website.id, addonId: addon.id } },
  })
  if (existing?.isActive) return { error: 'Bu eklenti zaten aktif' }

  const merchantOid = generateAddonMerchantOid(website.websiteId, addon.slug)
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const amountTry = addon.price / 100

  const result = await createPaymentToken({
    merchantOid,
    userEmail,
    userName,
    userPhone,
    userIp,
    paymentAmount: amountTry,
    currency: 'TL',
    installmentCount: 0,
    okUrl: `${baseUrl}/settings/addons?payment=success`,
    failUrl: `${baseUrl}/settings/addons?payment=failed`,
    storeCard: addon.purchaseType === 'MONTHLY' || addon.purchaseType === 'YEARLY',
  })

  if (result.status !== 'success' || !result.token) {
    return { error: result.reason || 'Ödeme token alınamadı' }
  }

  return {
    token: result.token,
    merchantOid,
    iframeUrl: getPaytrIframeUrl(result.token),
  }
}

export async function activateAddonFromPayment(
  websitePublicId: string,
  addonSlug: string
): Promise<void> {
  const website = await prisma.website.findUnique({
    where: { websiteId: websitePublicId },
    select: { id: true },
  })
  if (!website) throw new Error('Website not found')

  const addon = await prisma.addon.findUnique({ where: { slug: addonSlug } })
  if (!addon) throw new Error('Addon not found')

  const expiresAt =
    addon.purchaseType === 'MONTHLY'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : addon.purchaseType === 'YEARLY'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : null

  await prisma.addonPurchase.upsert({
    where: { websiteId_addonId: { websiteId: website.id, addonId: addon.id } },
    create: {
      websiteId: website.id,
      addonId: addon.id,
      isActive: true,
      autoRenew: addon.purchaseType !== 'ONCE',
      expiresAt,
    },
    update: {
      isActive: true,
      autoRenew: addon.purchaseType !== 'ONCE',
      expiresAt,
      cancelledAt: null,
    },
  })
}
