/** Kayıt / reklam kaynağı takibi — UTM + referral (first-touch) */

export type MarketingAttribution = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  referralCode?: string
  signupReferrer?: string
  signupLandingPage?: string
}

export type StoredAttribution = MarketingAttribution & {
  capturedAt: string
}

export const ATTRIBUTION_STORAGE_KEY = 'gu_marketing_attribution'

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

export function parseAttributionFromSearchParams(
  params: URLSearchParams,
  landingPage?: string
): MarketingAttribution | null {
  const utmSource = params.get('utm_source') ?? undefined
  const utmMedium = params.get('utm_medium') ?? undefined
  const utmCampaign = params.get('utm_campaign') ?? undefined
  const utmContent = params.get('utm_content') ?? undefined
  const utmTerm = params.get('utm_term') ?? undefined
  const referralCode = params.get('ref') ?? params.get('referral') ?? undefined

  const hasUtm = UTM_KEYS.some((k) => params.has(k))
  if (!hasUtm && !referralCode) return null

  return {
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    referralCode,
    signupLandingPage: landingPage,
  }
}

export function mergeAttribution(
  stored: MarketingAttribution | null | undefined,
  incoming: MarketingAttribution | null | undefined
): MarketingAttribution {
  return {
    utmSource: stored?.utmSource ?? incoming?.utmSource,
    utmMedium: stored?.utmMedium ?? incoming?.utmMedium,
    utmCampaign: stored?.utmCampaign ?? incoming?.utmCampaign,
    utmContent: stored?.utmContent ?? incoming?.utmContent,
    utmTerm: stored?.utmTerm ?? incoming?.utmTerm,
    referralCode: stored?.referralCode ?? incoming?.referralCode,
    signupReferrer: stored?.signupReferrer ?? incoming?.signupReferrer,
    signupLandingPage: stored?.signupLandingPage ?? incoming?.signupLandingPage,
  }
}

export function attributionForApi(
  stored: StoredAttribution | null,
  documentReferrer?: string
): MarketingAttribution {
  return mergeAttribution(stored, {
    signupReferrer: documentReferrer || undefined,
    signupLandingPage: stored?.signupLandingPage,
    utmSource: stored?.utmSource,
    utmMedium: stored?.utmMedium,
    utmCampaign: stored?.utmCampaign,
    utmContent: stored?.utmContent,
    utmTerm: stored?.utmTerm,
    referralCode: stored?.referralCode,
  })
}
