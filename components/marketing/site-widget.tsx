'use client'

import Script from 'next/script'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://guchat.org'

interface SiteWidgetProps {
  /** Panelden alınan public Website ID. Boşsa widget hiç render edilmez. */
  websiteId: string
}

/**
 * guchat.org tanıtım sayfasında kendi canlı sohbet widget'ımızı sağ alt köşede
 * gösterir (dogfooding). settings/widget sayfasındaki resmi embed snippet'iyle
 * aynı mantığı kullanır: önce $gu kuyruğu + GU_WIDGET_URL ayarlanır, ardından
 * public/widget.js yüklenir. Konumlandırma (sağ alt) widget.js içinde yapılır.
 *
 * websiteId, ana sayfa (server component) tarafından veritabanından çözülüp
 * prop olarak verilir; env değişkenine bağımlılık yoktur.
 */
export function SiteWidget({ websiteId }: SiteWidgetProps) {
  if (!websiteId) return null

  return (
    <>
      <Script id="gu-widget-config" strategy="afterInteractive">
        {`
          window.$gu = window.$gu || function() {
            (window.$gu.q = window.$gu.q || []).push(arguments);
          };
          window.GU_WIDGET_URL = '${APP_URL}';
          $gu('set', 'WEBSITE_ID', '${websiteId}');
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
