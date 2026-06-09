import { prisma } from './db'
import { generateAddonMerchantOid } from './payment-orders'
import { initializeCheckoutForm, isIyzicoConfigured } from './iyzico'

export async function initiateAddonCheckout(
  websitePublicId: string,
  addonSlug: string,
  userEmail: string,
  userName: string,
  userPhone: string,
  userIp: string
): Promise<
  | {
      token: string
      merchantOid: string
      checkoutFormContent?: string
      paymentPageUrl?: string
    }
  | { error: string }
> {
  if (!isIyzicoConfigured()) {
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
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const amountTry = addon.price / 100

  const result = await initializeCheckoutForm({
    conversationId: merchantOid,
    basketId: merchantOid,
    priceTry: amountTry,
    itemName: `Gu Chat Eklenti: ${addon.name}`,
    callbackUrl: `${baseUrl}/api/iyzico/callback?return=addons`,
    buyerEmail: userEmail,
    buyerName: userName,
    buyerPhone: userPhone,
    buyerIp: userIp,
  })

  if ('error' in result) {
    return { error: result.error }
  }

  return {
    token: result.token,
    merchantOid,
    checkoutFormContent: result.checkoutFormContent,
    paymentPageUrl: result.paymentPageUrl,
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
      expiresAt,
    },
    update: {
      isActive: true,
      expiresAt,
      cancelledAt: null,
    },
  })
}
