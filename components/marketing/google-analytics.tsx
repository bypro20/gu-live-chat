'use client'

import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID

/** Google Analytics 4 + opsiyonel Google Ads tag */
export function GoogleAnalytics() {
  if (!GA_ID && !ADS_ID) return null

  const primaryId = GA_ID ?? ADS_ID

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${GA_ID ? `gtag('config', '${GA_ID}', { anonymize_ip: true });` : ''}
          ${ADS_ID ? `gtag('config', '${ADS_ID}');` : ''}
        `}
      </Script>
    </>
  )
}
