/** GA4 — env ile override; production'da env yoksa varsayılan akış */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || 'G-9N57QN8W9M'

export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || ''

export const GOOGLE_ADS_CONVERSIONS = {
  register: process.env.NEXT_PUBLIC_GOOGLE_ADS_REGISTER_CONVERSION?.trim() || '',
  purchase: process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_CONVERSION?.trim() || '',
  lead: process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION?.trim() || '',
} as const
