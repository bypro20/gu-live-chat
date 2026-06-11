'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { GA_MEASUREMENT_ID, GOOGLE_ADS_ID } from '@/lib/analytics-config'

function GaPageViews() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window.gtag !== 'function') return
    const query = searchParams.toString()
    const page_path = query ? `${pathname}?${query}` : pathname
    window.gtag('config', GA_MEASUREMENT_ID, { page_path })
  }, [pathname, searchParams])

  return null
}

/** Google Analytics 4 + Google Ads tag (aynı gtag — dönüşüm + remarketing) */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID && !GOOGLE_ADS_ID) return null

  const loaderId = GA_MEASUREMENT_ID || GOOGLE_ADS_ID

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${loaderId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          ${GA_MEASUREMENT_ID ? `gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true, send_page_view: true, allow_google_signals: true });` : ''}
          ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}', { allow_enhanced_conversions: true });` : ''}
        `}
      </Script>
      <Suspense fallback={null}>
        <GaPageViews />
      </Suspense>
    </>
  )
}
