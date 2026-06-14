import { prisma } from './db'
import { generateTrialMerchantOid } from './payment-orders'
import { initializeCheckoutForm, isIyzicoConfigured } from './iyzico'
import { TRIAL_CARD_VERIFY_AMOUNT_TRY } from './trial-config'
import { getSiteUrl } from './site-config'

export function websiteHasSavedPaymentMethod(website: {
  paytrUserToken: string | null
  paytrCardToken: string | null
}): boolean {
  return Boolean(website.paytrUserToken && website.paytrCardToken)
}

export async function initiateTrialCheckout(
  websiteId: string,
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
    return { error: 'Ödeme sistemi henüz yapılandırılmamış' }
  }

  const website = await prisma.website.findUnique({
    where: { websiteId },
    select: { id: true },
  })
  if (!website) {
    return { error: 'Site bulunamadı' }
  }

  const merchantOid = generateTrialMerchantOid(websiteId)
  await prisma.website.update({
    where: { websiteId },
    data: { paytrMerchantOid: merchantOid },
  })

  const baseUrl = getSiteUrl()
  const result = await initializeCheckoutForm({
    conversationId: merchantOid,
    basketId: merchantOid,
    price: TRIAL_CARD_VERIFY_AMOUNT_TRY,
    itemName: 'Gu Live Chat — Deneme kart doğrulama',
    callbackUrl: `${baseUrl}/api/iyzico/callback?return=trial`,
    buyerEmail: userEmail,
    buyerName: userName,
    buyerPhone: userPhone,
    buyerIp: userIp,
    registerCard: true,
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
