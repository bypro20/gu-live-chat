'use client'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    lintrk?: (...args: unknown[]) => void
  }
}

import { GA_MEASUREMENT_ID, GOOGLE_ADS_CONVERSIONS } from '@/lib/analytics-config'

const ADS_REGISTER = GOOGLE_ADS_CONVERSIONS.register
const ADS_PURCHASE = GOOGLE_ADS_CONVERSIONS.purchase
const ADS_LEAD = GOOGLE_ADS_CONVERSIONS.lead

function gtagEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}

function adsConversion(sendTo: string | undefined, value?: number, currency = 'TRY') {
  if (!sendTo || typeof window.gtag !== 'function') return
  window.gtag('event', 'conversion', {
    send_to: sendTo,
    ...(value != null ? { value, currency } : {}),
  })
}

function fbqEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq('track', name, params)
}

/** Kayıt tamamlandı */
export function trackSignUp(props?: { plan?: string; method?: string }) {
  gtagEvent('sign_up', {
    method: props?.method ?? 'email',
    plan: props?.plan,
  })
  adsConversion(ADS_REGISTER)
  fbqEvent('CompleteRegistration', {
    content_name: props?.plan ?? 'register',
    status: true,
  })
}

/** Ödeme başarılı */
export function trackPurchase(props: { value?: number; currency?: string; plan?: string }) {
  const value = props.value
  const currency = props.currency ?? 'TRY'

  gtagEvent('purchase', {
    transaction_id: `purchase_${Date.now()}`,
    value,
    currency,
    items: props.plan ? [{ item_name: props.plan }] : undefined,
  })
  adsConversion(ADS_PURCHASE, value, currency)
  fbqEvent('Purchase', {
    value,
    currency,
    content_name: props.plan,
  })
}

/** İletişim / demo formu */
export function trackLead(props?: { subject?: string }) {
  gtagEvent('generate_lead', {
    lead_type: props?.subject ?? 'contact',
  })
  adsConversion(ADS_LEAD)
  fbqEvent('Lead', {
    content_name: props?.subject ?? 'contact',
  })
}

/** Sayfa görüntüleme — kampanya landing */
export function trackViewContent(props: { contentName: string; path?: string }) {
  gtagEvent('view_item', {
    item_name: props.contentName,
    page_path: props.path,
  })
  fbqEvent('ViewContent', {
    content_name: props.contentName,
  })
}

export function isMarketingTrackingConfigured() {
  return Boolean(
    GA_MEASUREMENT_ID ||
      process.env.NEXT_PUBLIC_META_PIXEL_ID ||
      process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID ||
      GOOGLE_ADS_CONVERSIONS.register
  )
}
