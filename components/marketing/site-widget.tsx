'use client'

import Script from 'next/script'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://guchat.org'

// Panelden alınan Website ID. Tanımlı değilse widget hiç render edilmez —
// böylece geçersiz bir id ile kırık bir sohbet balonu oluşmaz.
const WIDGET_WEBSITE_ID =
  process.env.NEXT_PUBLIC_WIDGET_WEBSITE_ID ||
  process.env.NEXT_PUBLIC_MARKETING_WEBSITE_ID ||
  ''

/**
 * guchat.org tanıtım sayfasında kendi canlı sohbet widget'ımızı sağ alt köşede
 * gösterir (dogfooding). settings/widget sayfasındaki resmi embed snippet'iyle
 * aynı mantığı kullanır: önce $gu kuyruğu + GU_WIDGET_URL ayarlanır, ardından
 * public/widget.js yüklenir. Konumlandırma (sağ alt) widget.js içinde yapılır.
 */
export function SiteWidget() {
  if (!WIDGET_WEBSITE_ID) return null

  return (
    <>
      <Script id="gu-widget-config" strategy="afterInteractive">
        {`
          window.$gu = window.$gu || function() {
            (window.$gu.q = window.$gu.q || []).push(arguments);
          };
          window.GU_WIDGET_URL = '${APP_URL}';
          $gu('set', 'WEBSITE_ID', '${WIDGET_WEBSITE_ID}');
        `}
      </Script>
      <Script
        id="gu-widget-loader"
        src={`${APP_URL}/widget.js`}
        strategy="afterInteractive"
      />
    </>
  )
}
