/** GA4 — env ile override; production'da env yoksa varsayılan akış */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-9N57QN8W9M'

/** Google Ads müşteri ID: 432-385-6670 → AW-4323856670 */
export const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || 'AW-4323856670'

/** GA4 olay adları — Google Ads GA4 içe aktarma ile eşleşir */
export const GA4_CONVERSION_EVENTS = {
  register: 'sign_up',
  purchase: 'purchase',
  lead: 'generate_lead',
} as const

export const GOOGLE_ADS_CONVERSIONS = {
  register: process.env.NEXT_PUBLIC_GOOGLE_ADS_REGISTER_CONVERSION?.trim() || '',
  purchase: process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_CONVERSION?.trim() || '',
  lead: process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION?.trim() || '',
} as const
