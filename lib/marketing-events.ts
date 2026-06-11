'use client'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    lintrk?: (...args: unknown[]) => void
  }
}

import {
  GA_MEASUREMENT_ID,
  GOOGLE_ADS_CONVERSIONS,
  GOOGLE_ADS_ID,
} from '@/lib/analytics-config'

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
  const params = {
    method: props?.method ?? 'email',
    plan: props?.plan,
  }
  gtagEvent('sign_up', params)
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

  const purchaseParams = {
    transaction_id: `purchase_${Date.now()}`,
    value,
    currency,
    items: props.plan ? [{ item_name: props.plan }] : undefined,
  }
  gtagEvent('purchase', purchaseParams)
  adsConversion(ADS_PURCHASE, value, currency)
  fbqEvent('Purchase', {
    value,
    currency,
    content_name: props.plan,
  })
}

/** İletişim / demo formu */
export function trackLead(props?: { subject?: string }) {
  const leadParams = { lead_type: props?.subject ?? 'contact' }
  gtagEvent('generate_lead', leadParams)
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
      GOOGLE_ADS_ID ||
      process.env.NEXT_PUBLIC_META_PIXEL_ID ||
      process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID ||
      GOOGLE_ADS_CONVERSIONS.register
  )
}
