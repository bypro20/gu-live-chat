import crypto from 'crypto'
import { SITE_LEGAL } from './site-legal'

const CLIENT_VERSION = 'gu-chat-iyzico-1.0'

export function getIyzicoBaseUrl(): string {
  if (process.env.IYZICO_BASE_URL) return process.env.IYZICO_BASE_URL
  return process.env.IYZICO_SANDBOX === 'true'
    ? 'https://sandbox-api.iyzipay.com'
    : 'https://api.iyzipay.com'
}

export function isIyzicoConfigured(): boolean {
  return Boolean(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY)
}

function generateRandomString(): string {
  return `${process.hrtime.bigint()}${Math.random().toString(36).slice(2)}`
}

function buildAuthHeaders(path: string, body: object) {
  const apiKey = process.env.IYZICO_API_KEY!
  const secretKey = process.env.IYZICO_SECRET_KEY!
  const randomString = generateRandomString()
  const bodyJson = JSON.stringify(body)

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(randomString + path + bodyJson)
    .digest('hex')

  const authorizationParams = [
    `apiKey:${apiKey}`,
    `randomKey:${randomString}`,
    `signature:${signature}`,
  ].join('&')

  return {
    Authorization: `IYZWSv2 ${Buffer.from(authorizationParams).toString('base64')}`,
    'x-iyzi-rnd': randomString,
    'x-iyzi-client-version': CLIENT_VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

async function iyzicoPost<T>(path: string, body: object): Promise<T> {
  const url = `${getIyzicoBaseUrl()}${path}`
  const headers = buildAuthHeaders(path, body)

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as T
  return data
}

async function iyzicoDelete<T>(path: string, body: object): Promise<T> {
  const url = `${getIyzicoBaseUrl()}${path}`
  const headers = buildAuthHeaders(path, body)

  const res = await fetch(url, {
    method: 'DELETE',
    headers,
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as T
  return data
}

export interface CheckoutInitResult {
  token: string
  checkoutFormContent?: string
  paymentPageUrl?: string
  conversationId: string
}

export interface CheckoutRetrieveResult {
  status: string
  paymentStatus?: string
  paidPrice?: string
  price?: string
  basketId?: string
  conversationId?: string
  cardUserKey?: string
  cardToken?: string
  errorCode?: string
  errorMessage?: string
}

export interface StoredCardChargeResult {
  status: string
  paymentId?: string
  paidPrice?: string
  errorCode?: string
  errorMessage?: string
}

function buildBuyerPayload(params: {
  conversationId: string
  buyerEmail: string
  buyerName: string
  buyerPhone?: string
  buyerIp: string
}) {
  const nameParts = params.buyerName.trim().split(/\s+/)
  const firstName = nameParts[0] || 'Müşteri'
  const surname = nameParts.slice(1).join(' ') || firstName

  return {
    buyer: {
      id: params.conversationId.slice(0, 50),
      name: firstName.slice(0, 50),
      surname: surname.slice(0, 50),
      gsmNumber: params.buyerPhone || '+905000000000',
      email: params.buyerEmail,
      identityNumber: '11111111111',
      registrationAddress: SITE_LEGAL.address,
      ip: params.buyerIp,
      city: 'Istanbul',
      country: 'Turkey',
      zipCode: '34000',
    },
    shippingAddress: {
      contactName: params.buyerName.slice(0, 100),
      city: 'Istanbul',
      country: 'Turkey',
      address: SITE_LEGAL.address,
      zipCode: '34000',
    },
    billingAddress: {
      contactName: params.buyerName.slice(0, 100),
      city: 'Istanbul',
      country: 'Turkey',
      address: SITE_LEGAL.address,
      zipCode: '34000',
    },
  }
}

export async function initializeCheckoutForm(params: {
  conversationId: string
  basketId: string
  /** Tutar — seçilen para biriminde */
  price: number
  itemName: string
  callbackUrl: string
  buyerEmail: string
  buyerName: string
  buyerPhone?: string
  buyerIp: string
  locale?: 'tr' | 'en'
  currency?: 'TRY' | 'EUR' | 'USD' | 'GBP' | 'NOK' | 'CHF'
}): Promise<CheckoutInitResult | { error: string }> {
  if (!isIyzicoConfigured()) {
    return { error: 'Ödeme sistemi henüz yapılandırılmamış' }
  }

  const priceStr = params.price.toFixed(2)
  const addresses = buildBuyerPayload(params)
  const locale = params.locale || 'tr'
  const currency = params.currency || 'TRY'

  const request = {
    locale,
    conversationId: params.conversationId,
    price: priceStr,
    paidPrice: priceStr,
    currency,
    basketId: params.basketId,
    paymentGroup: 'SUBSCRIPTION',
    callbackUrl: params.callbackUrl,
    enabledInstallments: currency === 'TRY' ? [1, 2, 3, 6, 9] : [1],
    ...addresses,
    basketItems: [
      {
        id: params.basketId.slice(0, 50),
        name: params.itemName.slice(0, 100),
        category1: 'Yazılım',
        itemType: 'VIRTUAL',
        price: priceStr,
      },
    ],
  }

  try {
    const result = await iyzicoPost<{
      status: string
      token?: string
      checkoutFormContent?: string
      paymentPageUrl?: string
      errorMessage?: string
    }>('/payment/iyzipos/checkoutform/initialize/auth/ecom', request)

    if (result.status !== 'success' || !result.token) {
      console.error('[iyzico] initialize failed:', result)
      return { error: result.errorMessage || 'Ödeme formu oluşturulamadı' }
    }

    return {
      token: result.token,
      checkoutFormContent: result.checkoutFormContent,
      paymentPageUrl: result.paymentPageUrl,
      conversationId: params.conversationId,
    }
  } catch (err) {
    console.error('[iyzico] initialize error:', err)
    return { error: 'iyzico bağlantı hatası' }
  }
}

export async function retrieveCheckoutForm(
  token: string,
  conversationId?: string
): Promise<CheckoutRetrieveResult> {
  return iyzicoPost<CheckoutRetrieveResult>(
    '/payment/iyzipos/checkoutform/auth/ecom/detail',
    {
      locale: 'tr',
      conversationId: conversationId || token,
      token,
    }
  )
}

/** Charge a stored card (NON3D) — used for subscription renewals. */
export async function chargeStoredCard(params: {
  conversationId: string
  basketId: string
  priceTry: number
  itemName: string
  cardUserKey: string
  cardToken: string
  buyerEmail: string
  buyerName: string
  buyerPhone?: string
  buyerIp: string
}): Promise<StoredCardChargeResult> {
  if (!isIyzicoConfigured()) {
    return { status: 'failure', errorMessage: 'Ödeme sistemi yapılandırılmamış' }
  }

  const priceStr = params.priceTry.toFixed(2)
  const addresses = buildBuyerPayload(params)

  const request = {
    locale: 'tr',
    conversationId: params.conversationId,
    price: priceStr,
    paidPrice: priceStr,
    currency: 'TRY',
    installment: 1,
    basketId: params.basketId,
    paymentGroup: 'SUBSCRIPTION',
    paymentCard: {
      cardUserKey: params.cardUserKey,
      cardToken: params.cardToken,
    },
    ...addresses,
    basketItems: [
      {
        id: params.basketId.slice(0, 50),
        name: params.itemName.slice(0, 100),
        category1: 'Yazılım',
        itemType: 'VIRTUAL',
        price: priceStr,
      },
    ],
  }

  try {
    const result = await iyzicoPost<StoredCardChargeResult>('/payment/auth', request)
    if (result.status !== 'success') {
      console.error('[iyzico] stored card charge failed:', result)
    }
    return result
  } catch (err) {
    console.error('[iyzico] stored card charge error:', err)
    return { status: 'failure', errorMessage: 'iyzico bağlantı hatası' }
  }
}

/** Remove a stored card from iyzico (best-effort on cancel). */
export async function deleteStoredCard(
  cardUserKey: string,
  cardToken: string
): Promise<boolean> {
  if (!isIyzicoConfigured()) return false

  try {
    const result = await iyzicoDelete<{ status: string }>('/cardstorage/card', {
      locale: 'tr',
      conversationId: cardUserKey.slice(0, 50),
      cardUserKey,
      cardToken,
    })
    return result.status === 'success'
  } catch (err) {
    console.error('[iyzico] delete stored card error:', err)
    return false
  }
}
