import crypto from 'crypto'

// ─── Configuration ────────────────────────────────────────────────
const MERCHANT_ID = process.env.PAYTR_MERCHANT_ID || ''
const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY || ''
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT || ''
const TEST_MODE = process.env.PAYTR_TEST_MODE === '1' ? '1' : '0'

const PAYTR_API_BASE = 'https://www.paytr.com'

// ─── Token Generation ─────────────────────────────────────────────
/**
 * Generate HMAC-SHA256 PayTR token
 * PayTR uses Base64(HMAC-SHA256(key, data + salt)) for authentication
 */
function generatePaytrToken(hashString: string): string {
  return crypto
    .createHmac('sha256', MERCHANT_KEY)
    .update(hashString + MERCHANT_SALT)
    .digest('base64')
}

// ─── iFrame Token (Step 1 — Initial Payment) ─────────────────────
export interface CreatePaymentTokenParams {
  merchantOid: string // Unique order ID
  userEmail: string
  userName: string
  userPhone: string
  userIp: string
  paymentAmount: number // Amount in TRY (e.g., 99.00)
  currency: string // 'TL', 'USD', 'EUR', 'GBP', 'RUB'
  installmentCount: number // 0 for single payment, 1-12 for installments
  okUrl: string // Success redirect URL
  failUrl: string // Failure redirect URL
  storeCard?: boolean // true for subscription (stores card for recurring)
}

export interface PaymentTokenResponse {
  status: 'success' | 'failed'
  token?: string
  reason?: string
}

/**
 * Create a PayTR iFrame payment token (Step 1)
 * Returns a token that can be used to render the PayTR payment iframe
 */
export async function createPaymentToken(
  params: CreatePaymentTokenParams
): Promise<PaymentTokenResponse> {
  const paymentAmountCents = Math.round(params.paymentAmount * 100) // Convert to cents (kuruş)
  const paymentType = 'card'
  const nonThreeD = '0' // Use 3D Secure for initial payment

  const hashString = [
    MERCHANT_ID,
    params.userIp,
    params.merchantOid,
    params.userEmail,
    paymentAmountCents,
    paymentType,
    params.installmentCount,
    params.currency,
    TEST_MODE,
    nonThreeD,
  ].join('')

  const paytrToken = generatePaytrToken(hashString)

  const body = new URLSearchParams({
    merchant_id: MERCHANT_ID,
    user_ip: params.userIp,
    merchant_oid: params.merchantOid,
    email: params.userEmail,
    payment_amount: paymentAmountCents.toString(),
    paytr_token: paytrToken,
    user_name: params.userName,
    user_phone: params.userPhone || '',
    payment_type: paymentType,
    installment_count: params.installmentCount.toString(),
    currency: params.currency,
    test_mode: TEST_MODE,
    debug_on: process.env.NODE_ENV === 'development' ? '1' : '0',
    non_3d: nonThreeD,
    merchant_ok_url: params.okUrl,
    merchant_fail_url: params.failUrl,
    timeout_limit: '30',
    store_card: params.storeCard ? '1' : '0',
    // Basket info (required by PayTR)
    user_basket: JSON.stringify([
      [params.merchantOid, paymentAmountCents.toString(), '1'],
    ]),
  })

  try {
    const response = await fetch(`${PAYTR_API_BASE}/odeme/api/get-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const data = await response.json()

    if (data.status === 'success' && data.token) {
      return { status: 'success', token: data.token }
    }

    return {
      status: 'failed',
      reason: data.reason || data.fail_reason || 'Token alınamadı',
    }
  } catch (error) {
    console.error('[PayTR] Token creation error:', error)
    return { status: 'failed', reason: 'Bağlantı hatası' }
  }
}

// ─── Recurring Payment (Non-3D, Server-Side) ─────────────────────
export interface RecurringPaymentParams {
  merchantOid: string // Unique order ID for this charge
  utoken: string // User token from initial payment
  ctoken: string // Card token from stored card
  paymentAmount: number // Amount in TRY
  currency: string // 'TL'
  userEmail: string
  userIp: string
}

export interface RecurringPaymentResponse {
  status: 'success' | 'failed' | 'wait_callback'
  msg?: string
  tryAgain?: boolean
}

/**
 * Process a recurring (subscription) payment using stored card
 * This is a server-side, Non-3D payment — no user interaction needed
 */
export async function processRecurringPayment(
  params: RecurringPaymentParams
): Promise<RecurringPaymentResponse> {
  const paymentAmountCents = Math.round(params.paymentAmount * 100)
  const paymentType = 'card'
  const nonThreeD = '1' // Required for recurring
  const recurringPayment = '1'

  const hashString = [
    MERCHANT_ID,
    params.userIp,
    params.merchantOid,
    params.userEmail,
    paymentAmountCents,
    paymentType,
    0, // installment_count — single payment for recurring
    params.currency,
    TEST_MODE,
    nonThreeD,
  ].join('')

  const paytrToken = generatePaytrToken(hashString)

  const body = new URLSearchParams({
    merchant_id: MERCHANT_ID,
    user_ip: params.userIp,
    merchant_oid: params.merchantOid,
    email: params.userEmail,
    payment_amount: paymentAmountCents.toString(),
    paytr_token: paytrToken,
    user_name: 'Gu Live Chat',
    user_phone: '',
    payment_type: paymentType,
    installment_count: '0',
    currency: params.currency,
    test_mode: TEST_MODE,
    non_3d: nonThreeD,
    recurring_payment: recurringPayment,
    utoken: params.utoken,
    ctoken: params.ctoken,
    merchant_ok_url: '',
    merchant_fail_url: '',
    timeout_limit: '30',
    user_basket: JSON.stringify([
      [params.merchantOid, paymentAmountCents.toString(), '1'],
    ]),
  })

  try {
    const response = await fetch(`${PAYTR_API_BASE}/odeme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const data = await response.json()

    if (data.status === 'success') {
      return { status: 'success' }
    }

    return {
      status: data.status === 'wait_callback' ? 'wait_callback' : 'failed',
      msg: data.msg || data.err_msg || 'Ödeme başarısız',
      tryAgain: data.try_again === '1',
    }
  } catch (error) {
    console.error('[PayTR] Recurring payment error:', error)
    return { status: 'failed', msg: 'Bağlantı hatası' }
  }
}

// ─── Card Storage (CAPI) ───────────────────────────────────────────
export interface StoredCard {
  ctoken: string
  last4: string
  requireCvv: boolean
  brand: string
  type: string
  schema: string
}

/**
 * List stored cards for a user (utoken)
 */
export async function listStoredCards(utoken: string): Promise<StoredCard[]> {
  const hashString = utoken + MERCHANT_SALT
  const paytrToken = generatePaytrToken(hashString)

  try {
    const response = await fetch(`${PAYTR_API_BASE}/odeme/capi/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        merchant_id: MERCHANT_ID,
        utoken,
        paytr_token: paytrToken,
      }).toString(),
    })

    const data = await response.json()
    if (data.status === 'success' && data.cards) {
      return data.cards.map((card: Record<string, unknown>) => ({
        ctoken: card.ctoken as string,
        last4: card.last_4 as string,
        requireCvv: card.require_cvv as boolean,
        brand: card.c_brand as string,
        type: card.c_type as string,
        schema: card.schema as string,
      }))
    }
    return []
  } catch (error) {
    console.error('[PayTR] List stored cards error:', error)
    return []
  }
}

/**
 * Delete a stored card
 */
export async function deleteStoredCard(
  ctoken: string,
  utoken: string
): Promise<boolean> {
  const hashString = ctoken + utoken + MERCHANT_SALT
  const paytrToken = generatePaytrToken(hashString)

  try {
    const response = await fetch(`${PAYTR_API_BASE}/odeme/capi/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        merchant_id: MERCHANT_ID,
        utoken,
        ctoken,
        paytr_token: paytrToken,
      }).toString(),
    })

    const data = await response.json()
    return data.status === 'success'
  } catch (error) {
    console.error('[PayTR] Delete stored card error:', error)
    return false
  }
}

// ─── Callback Verification ─────────────────────────────────────────
export interface PaytrCallbackData {
  merchantOid: string
  status: 'success' | 'failed'
  totalAmount: number // In kuruş (cents)
  paymentAmount: number // In kuruş (cents)
  paymentType: string
  currency: string
  installmentCount: string
  testMode: string
  hash: string
  utoken?: string // Present when store_card=1 and payment successful
  ctoken?: string // Present when store_card=1 and payment successful
  failedReasonCode?: string
  failedReasonMsg?: string
}

/**
 * Verify PayTR callback hash to ensure authenticity
 */
export function verifyCallback(body: Record<string, string>): boolean {
  const hashString =
    body.merchant_oid + MERCHANT_SALT + body.status + body.total_amount

  const expectedHash = crypto
    .createHmac('sha256', MERCHANT_KEY)
    .update(hashString)
    .digest('base64')

  return expectedHash === body.hash
}

/**
 * Parse and validate PayTR callback data
 */
export function parseCallback(
  body: Record<string, string>
): PaytrCallbackData | null {
  if (!verifyCallback(body)) {
    console.error('[PayTR] Invalid callback hash')
    return null
  }

  return {
    merchantOid: body.merchant_oid,
    status: body.status === 'success' ? 'success' : 'failed',
    totalAmount: parseInt(body.total_amount, 10),
    paymentAmount: parseInt(body.payment_amount, 10),
    paymentType: body.payment_type,
    currency: body.currency,
    installmentCount: body.installment_count,
    testMode: body.test_mode,
    hash: body.hash,
    utoken: body.utoken || undefined,
    ctoken: body.ctoken || undefined,
    failedReasonCode: body.failed_reason_code || undefined,
    failedReasonMsg: body.failed_reason_msg || undefined,
  }
}

// ─── Refund ───────────────────────────────────────────────────────
export interface RefundParams {
  merchantOid: string
  amount: number // Amount in TRY to refund (partial refund supported)
}

/**
 * Refund a payment (full or partial)
 */
export async function refundPayment(
  params: RefundParams
): Promise<{ status: 'success' | 'failed'; msg?: string }> {
  const returnAmountCents = Math.round(params.amount * 100)

  const hashString =
    MERCHANT_ID + params.merchantOid + returnAmountCents + MERCHANT_SALT

  const paytrToken = generatePaytrToken(hashString)

  try {
    const response = await fetch(`${PAYTR_API_BASE}/odeme/iade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        merchant_id: MERCHANT_ID,
        merchant_oid: params.merchantOid,
        return_amount: returnAmountCents.toString(),
        paytr_token: paytrToken,
      }).toString(),
    })

    const data = await response.json()
    return {
      status: data.status === 'success' ? 'success' : 'failed',
      msg: data.msg || data.err_msg,
    }
  } catch (error) {
    console.error('[PayTR] Refund error:', error)
    return { status: 'failed', msg: 'Bağlantı hatası' }
  }
}

// ─── Status Inquiry ───────────────────────────────────────────────
/**
 * Check the status of a payment by merchant_oid
 */
export async function checkPaymentStatus(merchantOid: string): Promise<{
  status: string
  paymentAmount?: number
  msg?: string
}> {
  const hashString = MERCHANT_ID + merchantOid + MERCHANT_SALT
  const paytrToken = generatePaytrToken(hashString)

  try {
    const response = await fetch(`${PAYTR_API_BASE}/odeme/durum-sorgu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        merchant_id: MERCHANT_ID,
        merchant_oid: merchantOid,
        paytr_token: paytrToken,
      }).toString(),
    })

    const data = await response.json()
    return {
      status: data.status || 'unknown',
      paymentAmount: data.payment_amount
        ? parseInt(data.payment_amount, 10)
        : undefined,
      msg: data.msg,
    }
  } catch (error) {
    console.error('[PayTR] Status inquiry error:', error)
    return { status: 'error', msg: 'Bağlantı hatası' }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────
/**
 * Generate a unique merchant order ID
 */
export function generateMerchantOid(
  websiteId: string,
  planId: string
): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(4).toString('hex')
  return `gu_${websiteId.slice(-8)}_${planId}_${timestamp}_${random}`
}

/**
 * Get the iFrame URL for a payment token
 */
export function getPaytrIframeUrl(token: string): string {
  return `https://www.paytr.com/odeme/guvenli/${token}`
}

/**
 * Check if PayTR is configured (all required env vars are set)
 */
export function isPaytrConfigured(): boolean {
  return !!(MERCHANT_ID && MERCHANT_KEY && MERCHANT_SALT)
}