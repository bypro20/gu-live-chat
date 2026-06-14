import crypto from 'crypto'

/** Merchant OID for plan purchases: gu_{suffix}_{planId}_{ts}_{rand} */
export function generateMerchantOid(websiteId: string, planId: string): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(4).toString('hex')
  return `gu_${websiteId.slice(-8)}_${planId}_${timestamp}_${random}`
}

/** Merchant OID for addon purchases: gu_{suffix}_addon_{slug}_{ts}_{rand} */
export function generateAddonMerchantOid(websiteId: string, addonSlug: string): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(4).toString('hex')
  const safeSlug = addonSlug.replace(/[^a-z0-9-]/gi, '').slice(0, 40)
  return `gu_${websiteId.slice(-8)}_addon_${safeSlug}_${timestamp}_${random}`
}

/** PRO deneme — kart doğrulama: gu_{suffix}_trial_{ts}_{rand} */
export function generateTrialMerchantOid(websiteId: string): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(4).toString('hex')
  return `gu_${websiteId.slice(-8)}_trial_${timestamp}_${random}`
}

export type ParsedMerchantOid =
  | { kind: 'plan'; websiteIdSuffix: string; planId: string }
  | { kind: 'addon'; websiteIdSuffix: string; addonSlug: string }
  | { kind: 'trial'; websiteIdSuffix: string }

/** Extract plan or addon purchase info from a merchant OID / basket id. */
export function parseMerchantOid(merchantOid: string): ParsedMerchantOid | null {
  const parts = merchantOid.split('_')
  if (parts.length < 3 || parts[0] !== 'gu') return null
  if (parts[2] === 'addon' && parts[3]) {
    return { kind: 'addon', websiteIdSuffix: parts[1], addonSlug: parts[3] }
  }
  if (parts[2] === 'trial') {
    return { kind: 'trial', websiteIdSuffix: parts[1] }
  }
  return { kind: 'plan', websiteIdSuffix: parts[1], planId: parts[2] }
}
